const { Worker } = require("bullmq");
const connection = require("../config/redis");
const Workflow = require("../models/Workflow");
const Execution = require("../models/Execution");
const { getIO } = require("../socket/socketManager");

console.log("🚀 Worker initialized...");

const runWorkflow = require("../services/workflowEngine");

const worker = new Worker(
  "workflow-queue",
  async (job) => {
    const { workflowId, executionId } = job.data;

    // fix:-> handle both 'payload' and 'data' key names
    // (executionController may send either one)
    const payload = job.data.payload || job.data.data || {};

    try {
      console.log(`\n📦 Processing workflow job: ${job.id}`);
      console.log("Workflow ID received:", workflowId);
      console.log("Payload received:", JSON.stringify(payload));

      const workflow = await Workflow.findById(workflowId);
      if (!workflow) throw new Error("Workflow not found");

      console.log(" Workflow loaded:", workflow.name);

      // -> mark execution as 'running' before steps begin
      await Execution.findByIdAndUpdate(executionId, {
        status: "running",
        startTime: new Date(),
      });

      // -> emit correct event name — frontend listens to 'execution:started'
      const io = getIO();
      if (io) {
        io.emit("execution:started", {
          executionId,
          workflowId,
          status: "running",
        });
      }

      // run all steps — pass io so engine can emit step events
      await runWorkflow(workflow, executionId, payload, io);

      // mark completed
      await Execution.findByIdAndUpdate(executionId, {
        status: "completed",
        endTime: new Date(),
      });

      console.log("✔ Workflow execution completed");

      // -> emit correct event name — frontend listens to 'execution:completed'
      if (io) {
        io.emit("execution:completed", {
          executionId,
          workflowId,
          status: "completed",
        });
      }

      return { success: true };

    } catch (error) {
      console.error("✗ Workflow failed:", error.message);

      // mark failed in DB
      try {
        await Execution.findByIdAndUpdate(executionId, {
          status: "failed",
          endTime: new Date(),
        });
      } catch (_) {}

      // ✅ FIX 5: emit correct event name — frontend listens to 'execution:failed'
      const io = getIO();
      if (io) {
        io.emit("execution:failed", {
          executionId,
          workflowId: job.data.workflowId,
          status: "failed",
          error: error.message,
        });
      }

      return { success: false, error: error.message };
    }
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} ✔ completed`);
});

worker.on("failed", (job, err) => {
  console.log(`Job ${job.id} ✗ failed:`, err.message);
});

module.exports = worker;