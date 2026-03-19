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
app.use(cors({
  origin: [
    "http://localhost:5173",
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
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