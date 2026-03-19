require("dotenv").config();

const connectDB = require("./src/config/db");
//connection
connectDB();

// start worker
require("./src/workers/workflowWorker");

console.log("Workflow Worker Running");