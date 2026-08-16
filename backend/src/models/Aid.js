const mongoose = require("mongoose");

const aidSchema = new mongoose.Schema(
  {
    beneficiaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Beneficiary",
      required: true,
    },

    emergencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Emergency",
      required: true,
    },

    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
    },
    householdId: {
      type: String,
      required: true,
    },
    aidCycle: {
      type: String,
      required: true,
    },
    claimId: {
      type: String,
      required: true,
      unique: true,
    },

    amountAllocated: {
      type: Number,
      required: true,
    },
    allocatedAmount: {
      type: Number,
      required: true,
    },

    aidStatus: {
      type: String,
      enum: ["ALLOCATED", "DELIVERED"],
      default: "ALLOCATED",
    },

    blockchainHash: {
      type: String,
    },
    proofHash: {
      type: String,
    },
    proofUrl: {
      type: String,
    },
    onChainTxId: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Aid", aidSchema);
