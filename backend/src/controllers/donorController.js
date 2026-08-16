const Donation = require("../models/Donation");
const Emergency = require("../models/Emergency");
const Aid = require("../models/Aid");
const blockchain = require("../blockchain/adapter");
const mongoose = require("mongoose");

const isPaymentWebhook = (req) => {
  const configuredSecret = process.env.PAYMENT_WEBHOOK_SECRET;
  const providedSecret = req.headers["x-payment-webhook-secret"];
  return Boolean(configuredSecret && providedSecret && providedSecret === configuredSecret);
};

/* ================= GET EMERGENCIES ================= */
exports.getEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find();
    res.json(emergencies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= CREATE DONATION ================= */
exports.donate = async (req, res) => {
  const { emergencyId, amount, paymentMethod } = req.body;

  if (!emergencyId || amount === undefined || amount === null || !paymentMethod) {
    return res.status(400).json({ message: "All fields required" });
  }
  if (!mongoose.Types.ObjectId.isValid(emergencyId)) {
    return res.status(404).json({ message: "Emergency not found" });
  }

  const donationAmount = Number(amount);
  if (!Number.isFinite(donationAmount) || donationAmount <= 0) {
    return res.status(400).json({ message: "Amount must be a positive number" });
  }

  try {
    const emergency = await Emergency.findById(emergencyId).lean();
    if (!emergency) {
      return res.status(404).json({ message: "Emergency not found" });
    }

    const donation = await Donation.create({
      donorId: req.user.id,
      emergencyId,
      amount: donationAmount,
      paymentMethod,
      paymentStatus: "PENDING", // matches schema
    });

    res.json({
      message: "Donation created",
      donationId: donation._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= CONFIRM PAYMENT ================= */
exports.confirmPayment = async (req, res) => {
  const { donationId, transactionId, status } = req.body;
  const normalizedStatus = status?.toString().toUpperCase();
  const canConfirmPayment = req.user?.role === "ADMIN" || isPaymentWebhook(req);

  if (!donationId || !normalizedStatus) {
    return res.status(400).json({ message: "Donation ID and status required" });
  }
  if (!["SUCCESS", "FAILED", "PENDING"].includes(normalizedStatus)) {
    return res.status(400).json({ message: "Invalid payment status" });
  }
  if (!canConfirmPayment) {
    return res.status(403).json({ message: "Access denied" });
  }

  const session = await mongoose.startSession();
  try {
    let donation;

    await session.withTransaction(async () => {
      donation = await Donation.findById(donationId).session(session);
      if (!donation) {
        return;
      }

      const previousStatus = donation.paymentStatus;
      let fundsDelta = 0;

      if (previousStatus !== "SUCCESS" && normalizedStatus === "SUCCESS") {
        fundsDelta = donation.amount;
      } else if (previousStatus === "SUCCESS" && normalizedStatus !== "SUCCESS") {
        fundsDelta = -donation.amount;
      }

      donation.paymentStatus = normalizedStatus;
      if (transactionId) donation.transactionId = transactionId;
      await donation.save({ session });

      if (fundsDelta !== 0) {
        await Emergency.findByIdAndUpdate(
          donation.emergencyId,
          { $inc: { totalFundsCollected: fundsDelta } },
          { session }
        );
      }
    });

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    res.json({ message: "Donation status updated", donation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    session.endSession();
  }
};

/* ================= DONATION TRACE ================= */
exports.getDonationTrace = async (req, res) => {
  const { donationId } = req.params;
  if (!donationId) {
    return res.status(400).json({ message: "Donation ID required" });
  }

  try {
    const donation = await Donation.findById(donationId).lean();
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    if (req.user.role !== "ADMIN" && donation.donorId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const aid = await Aid.findOne({ donationId }).lean();
    const chainClaim = aid?.claimId
      ? await blockchain.getClaim({ claimId: aid.claimId })
      : null;

    res.json({
      donation,
      aid: aid || null,
      chainClaim,
      trace: {
        donationOnChainTxId: donation.onChainTxId || null,
        aidClaimId: aid?.claimId || null,
        aidOnChainTxId: aid?.onChainTxId || null,
        proofHash: aid?.proofHash || null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET DONOR TRANSACTIONS ================= */
exports.getTransactions = async (req, res) => {
  try {
    let donations;
    // Admin can view all donations, others only their own
    if (req.user && req.user.role === "ADMIN") {
      donations = await Donation.find().populate("donorId", "name").lean();
    } else {
      donations = await Donation.find({ donorId: req.user.id }).populate("donorId", "name").lean();
    }

    const donationList = donations.map((donation) => ({
      ...donation,
      donorName: donation.donorId?.name || "Unknown Donor",
    }));

    res.json(donationList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// const Donation = require("../models/Donation");
// const Emergency = require("../models/Emergency");

// /* ================= CREATE DONATION ================= */
// exports.createDonation = async (req, res) => {
//   const { emergencyId, amount, paymentMethod } = req.body;

//   if (!emergencyId || !amount || !paymentMethod) {
//     return res.status(400).json({ message: "All fields required" });
//   }

//   try {
//     const donation = await Donation.create({
//       donorId: req.user.id,
//       emergencyId,
//       amount,
//       paymentMethod,
//       paymentStatus: "PENDING",
//     });

//     res.json({
//       message: "Donation created",
//       donationId: donation._id,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // const Emergency = require("../models/Emergency");
// // const Donation = require("../models/Donation");
// // const Proof = require("../models/Proof");

// // exports.getEmergencies = async (req, res) => {
// //   res.json(await Emergency.find());
// // };

// // exports.donate = async (req, res) => {
// //   await new Donation(req.body).save();
// //   res.json({ message: "Donation successful" });
// // };

// // exports.getTransactions = async (req, res) => {
// //   res.json(await Donation.find());
// // };

// // exports.getProofs = async (req, res) => {
// //   res.json(await Proof.find());
// // };
