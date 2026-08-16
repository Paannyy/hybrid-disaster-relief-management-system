const mongoose = require("mongoose");

const proofSchema = new mongoose.Schema(
  {
    emergencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Emergency",
      required: true,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },
    aidCycle: {
      type: String,
    },
    proofHash: {
      type: String,
      required: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Proof", proofSchema);
