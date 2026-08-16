const mongoose = require("mongoose");

const aidCycleSchema = new mongoose.Schema(
  {
    emergencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Emergency",
      required: true,
    },
    cycleId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "CLOSED"],
      default: "ACTIVE",
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

aidCycleSchema.index({ emergencyId: 1, cycleId: 1 }, { unique: true });

module.exports = mongoose.model("AidCycle", aidCycleSchema);
