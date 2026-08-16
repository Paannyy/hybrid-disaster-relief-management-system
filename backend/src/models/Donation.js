const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    emergencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Emergency",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    paymentMethod: {
      type: String,
      enum: ["UPI", "CARD", "NET_BANKING"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },

    transactionId: {
      type: String,
    },
    onChainTxId: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);
