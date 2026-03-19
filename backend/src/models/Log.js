const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    executionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Execution",
      required: true,
    },
    stepName: {
      type: String,
      required: true,
    },
    result: {
      type: String, // ✅ MUST BE STRING
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Log", logSchema);