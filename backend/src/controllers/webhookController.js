const Workflow = require("../models/Workflow");
const Execution = require("../models/Execution");
const workflowQueue = require("../queue/workflowQueue");

exports.handleWebhook = async (req, res) => {

  try {

    const { eventType } = req.params;
    const payload = req.body;

    console.log("Webhook event received:", eventType);

    // find workflows matching trigger
    const workflows = await Workflow.find({
      triggerType: eventType,
      status: "active"
    });

    if (!workflows.length) {
      return res.json({
        message: "No workflows for this event"
      });
    }

    for (const workflow of workflows) {

      const execution = await Execution.create({
        workflowId: workflow._id,
        status: "running",
        startTime: new Date()
      });

      await workflowQueue.add("execute-workflow", {
        executionId: execution._id,
        workflowId: workflow._id,
        payload
      });

    }

    res.json({
      message: "Webhook processed",
      workflowsTriggered: workflows.length
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

};