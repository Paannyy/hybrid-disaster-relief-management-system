const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    severity: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    totalFundsRequired: {
      type: Number,
      default: 0,
    },

    totalFundsCollected: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "CLOSED"],
      default: "ACTIVE",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Emergency", emergencySchema);
