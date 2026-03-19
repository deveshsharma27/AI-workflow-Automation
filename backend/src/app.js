const express = require("express");
const cors = require("cors");
const redisConnection = require("./config/redis");

const authRoutes = require("./routes/authRoutes");
const workflowRoutes = require("./routes/workflowRoutes");
const executionRoutes = require("./routes/executionRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

const app = express();

// ✅ CHANGE 1 — CORS updated
// Allows both local dev (localhost:5173) and your Netlify production URL
import cors from "cors";

const allowedOrigins = [
  "http://localhost:5173",
  "https://workflow-automationwithai.netlify.app",
];

app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin || // allow non-browser requests
      allowedOrigins.includes(origin) ||
      origin.endsWith(".netlify.app") // 🔥 THIS FIX
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json());

// ✅ CHANGE 2 — Health check route
// Render calls this to confirm your server started successfully
// Without it, Render shows "Deploy failed" even when server is running fine
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "FlowAI Backend",
    timestamp: new Date().toISOString(),
  });
});

// Original root route — keep as is
app.get("/", (req, res) => {
  res.send("AI Workflow Automation Backend Running");
});

// Routes — unchanged
app.use("/auth", authRoutes);
app.use("/workflows", workflowRoutes);
app.use("/executions", executionRoutes);
app.use("/webhook", webhookRoutes);

module.exports = app;