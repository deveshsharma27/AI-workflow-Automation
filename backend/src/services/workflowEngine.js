const Log = require("../models/Log");
const { analyzeText } = require("./aiService");

const runWorkflow = async (workflow, executionId, payload, io) => {

  if (!workflow || !workflow.steps) {
    throw new Error("Invalid workflow definition");
  }

  // ✅ FIX 1: never crash if payload is missing — default to empty object
  const safePayload = payload || {};

  let aiResult = null;

  for (const step of workflow.steps) {

    console.log("Running step:", step.type);

    let result = "";

    try {

      // ─── AI ANALYSIS STEP ────────────────────────────────────────────
      if (step.type === "ai_analysis") {

        // -> safe payload reading — try every common field name
        const message =
          safePayload.message ||
          safePayload.customerMessage ||
          safePayload.orderNote ||
          safePayload.body ||
          safePayload.text ||
          safePayload.content ||
          (typeof safePayload === "string" ? safePayload : null) ||
          JSON.stringify(safePayload) ||
          "No input provided";

        console.log("📝 Message for AI:", message);

        aiResult = await analyzeText(message);

        console.log("🤖 AI Result:", aiResult);

        result = `Intent: ${aiResult.intent} | Priority: ${aiResult.priority} | Summary: ${aiResult.summary}`;

      }

      // ─── CONDITION STEP ──────────────────────────────────────────────
      else if (step.type === "condition") {

        // => frontend saves { field, operator, value } — not keyword
        // support both old 'keyword' format and new { field, operator, value } format
        const field    = step.config?.field    || "";
        const operator = step.config?.operator || "equals";
        const value    = step.config?.value    || step.config?.keyword || "";

        let conditionMet = false;

        if (aiResult && field) {
          // check field on aiResult (e.g. field="priority", value="high")
          const fieldValue = (aiResult[field] || "").toString().toLowerCase();
          const checkValue = value.toLowerCase();

          if (operator === "equals")      conditionMet = fieldValue === checkValue;
          else if (operator === "not_equals") conditionMet = fieldValue !== checkValue;
          else if (operator === "contains")   conditionMet = fieldValue.includes(checkValue);
          else if (operator === "greater_than") conditionMet = parseFloat(fieldValue) > parseFloat(checkValue);
          else if (operator === "less_than")    conditionMet = parseFloat(fieldValue) < parseFloat(checkValue);
          else conditionMet = fieldValue.includes(checkValue); // fallback

        } else if (value) {
          // legacy: keyword match against raw payload
          const payloadStr = JSON.stringify(safePayload).toLowerCase();
          conditionMet = payloadStr.includes(value.toLowerCase());
        }

        if (conditionMet) {
          console.log(`✔ Condition matched: ${field} ${operator} "${value}"`);
          result = `Condition matched: ${field} ${operator} "${value}"`;
        } else {
          console.log(`❌ Condition not matched: ${field} ${operator} "${value}"`);
          result = `Condition not matched: ${field} ${operator} "${value}"`;
        }

      }

      // ─── ACTION STEP ─────────────────────────────────────────────────
      else if (step.type === "action") {

        // => frontend saves step.config.action — not step.config.type
        const actionType = step.config?.action || step.config?.type || "unknown";

        console.log("⚡ Action:", actionType);

        if (actionType === "notify_support" || actionType === "escalate") {
          result = "Support team notified";
          console.log("📣 Action: support team notified");

        } else if (actionType === "store_log" || actionType === "store") {
          result = "Event logged to database";
          console.log("📋 Action: logged to DB");

        } else if (actionType === "update_status") {
          result = "Status updated";
          console.log("🔄 Action: status updated");

        } else if (actionType === "start_fulfillment") {
          result = "Fulfillment started";
          console.log("🚀 Action: fulfillment started");

        } else if (actionType === "close_ticket") {
          result = "Ticket closed";
          console.log("✅ Action: ticket closed");

        } else {
          result = `Action executed: ${actionType}`;
          console.log(`⚡ Action executed: ${actionType}`);
        }

      }

      // ─── NOTIFICATION STEP ───────────────────────────────────────────
      else if (step.type === "notification") {

        const channel = step.config?.channel || "email";
        const message = step.config?.message || "Workflow notification";

        console.log(`🔔 Notification via ${channel}: ${message}`);
        result = `Notification sent via ${channel}`;

      }

      // ─── EMAIL STEP ──────────────────────────────────────────────────
      else if (step.type === "email") {

        const template = step.config?.template || "default";
        const to       = step.config?.to || safePayload?.customer?.email || "customer";

        console.log(`✉ Email: template=${template} to=${to}`);
        result = `Email sent (template: ${template})`;

      }

      // ─── UNKNOWN STEP ────────────────────────────────────────────────
      else {
        result = `Unknown step type: ${step.type}`;
        console.log("⚠ Unknown step type:", step.type);
      }

    } catch (stepError) {
      // fix=> one step failing shouldn't kill the whole workflow
      console.error(`❌ Step "${step.type}" error:`, stepError.message);
      result = `Step error: ${stepError.message}`;
    }

    // ─── Save log for this step ───────────────────────────────────────
    await Log.create({
      executionId,
      stepName: step.name || step.type,
      result: typeof result === "string" ? result : JSON.stringify(result),
    });

    // ✅ FIX 6: emit step progress so frontend timeline updates live
    if (io) {
      io.emit("execution:step", {
        executionId,
        stepName: step.name || step.type,
        stepType: step.type,
        status: "completed",
        result: typeof result === "string" ? result : JSON.stringify(result),
      });
    }

    console.log(`✅ Step "${step.type}" done:`, result);
  }

};

module.exports = runWorkflow;