const Execution = require("../models/Execution");
const workflowQueue = require("../queue/workflowQueue");
const Log = require("../models/Log");

// START EXECUTION
exports.startExecution = async (req, res) => {
  try {
    const { workflowId } = req.body;

    // Accept both 'payload' and 'data' key names from any caller
    const triggerData = req.body.payload || req.body.data || {};

    console.log("Execution requested for workflow:", workflowId);
    console.log("Trigger data received:", JSON.stringify(triggerData));

    const execution = await Execution.create({
      workflowId,
      status: "pending",
      startTime: new Date(),
    });

    await workflowQueue.add("execute-workflow", {
      executionId: execution._id,
      workflowId,
      payload: triggerData,  // workflowWorker reads job.data.payload
    });

    //  wrap in { execution: ... } so frontend res.data.execution works
    res.json({
      message: "Workflow execution started",
      execution,
    });

  } catch (error) {
    console.error("startExecution error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// GET ALL EXECUTIONS
exports.getExecutions = async (req, res) => {
  try {
    const executions = await Execution.find()
      .populate("workflowId", "name triggerType")
      .sort({ createdAt: -1 })
      .limit(100);

    // wrap in { executions: [...] } so frontend data?.executions works
    // Dashboard and Executions page both check: data?.executions || data || []
    // Wrapping makes the first check succeed reliably
    res.json({ executions });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET SINGLE EXECUTION
exports.getExecution = async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.id)
      .populate("workflowId", "name triggerType steps");

    if (!execution) return res.status(404).json({ error: "Execution not found" });

    // { execution: ... }
    res.json({ execution });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET EXECUTION LOGS
exports.getExecutionLogs = async (req, res) => {
  try {
    const logs = await Log.find({ executionId: req.params.id })
      .sort({ createdAt: 1 });

    //  { logs: [...] } so frontend data?.logs works
    res.json({ logs });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};