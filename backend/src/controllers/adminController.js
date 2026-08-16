const Emergency = require("../models/Emergency");
const Beneficiary = require("../models/Beneficiary");
const Proof = require("../models/Proof");
const Donation = require("../models/Donation");
const Aid = require("../models/Aid");
const AidCycle = require("../models/AidCycle");
const crypto = require("crypto");
const mongoose = require("mongoose");
const blockchain = require("../blockchain/adapter");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const buildDonationPoolSummary = async (emergencyId) => {
  const [successDonations, aidAllocations, activeCycle] = await Promise.all([
    Donation.find({
      emergencyId,
      paymentStatus: "SUCCESS",
    })
      .select("_id amount createdAt")
      .lean(),
    Aid.find({
      emergencyId,
      donationId: { $ne: null },
    })
      .select("donationId allocatedAmount amountAllocated")
      .lean(),
    AidCycle.findOne({
      emergencyId,
      status: "ACTIVE",
    })
      .select("cycleId status startedAt")
      .lean(),
  ]);

  const allocatedByDonationId = new Map();
  for (const aid of aidAllocations) {
    if (!aid.donationId) continue;
    const key = aid.donationId.toString();
    const value = Number(aid.allocatedAmount ?? aid.amountAllocated ?? 0);
    allocatedByDonationId.set(key, (allocatedByDonationId.get(key) || 0) + value);
  }

  const donationBreakdown = successDonations.map((donation) => {
    const donationAmount = Number(donation.amount || 0);
    const totalAllocated = Number(allocatedByDonationId.get(donation._id.toString()) || 0);
    const remainingAmount = Math.max(0, donationAmount - totalAllocated);

    return {
      donationId: donation._id,
      amount: donationAmount,
      totalAllocated,
      remainingAmount,
      isEligible: remainingAmount > 0,
      createdAt: donation.createdAt,
    };
  });

  const totalSuccessDonations = donationBreakdown.length;
  const totalSuccessAmount = donationBreakdown.reduce((sum, donation) => sum + donation.amount, 0);
  const totalAllocatedDonations = donationBreakdown.filter((donation) => donation.totalAllocated > 0).length;
  const totalAllocatedAmount = donationBreakdown.reduce(
    (sum, donation) => sum + donation.totalAllocated,
    0
  );
  const eligibleDonations = donationBreakdown.filter((donation) => donation.isEligible);
  const eligibleDonationCount = eligibleDonations.length;
  const eligibleDonationAmount = eligibleDonations.reduce(
    (sum, donation) => sum + donation.remainingAmount,
    0
  );

  return {
    totalSuccessDonations,
    totalSuccessAmount,
    totalAllocatedDonations,
    totalAllocatedAmount,
    eligibleDonationCount,
    eligibleDonationAmount,
    totalRemainingPool: eligibleDonationAmount,
    donations: donationBreakdown,
    activeCycle: activeCycle || null,
  };
};

/* ================= ADD EMERGENCY ================= */
exports.addEmergency = async (req, res) => {
  try {
    console.log("Incoming Emergency:", req.body);

    const emergency = await new Emergency(req.body).save();

    console.log("Saved Emergency:", emergency);

    res.json({ message: "Emergency added" });
  } catch (err) {
    console.error("Emergency Save Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ================= DISTRIBUTE AID ================= */
// This endpoint marks all pending donations for an emergency as approved and
// creates a corresponding Aid record for each one (simulating blockchain
// logging).  The admin dashboard can call this after verifying beneficiaries
// or whenever funds are ready to move.
exports.distributeAid = async (req, res) => {
  const { emergencyId, cycleId, householdId, donationId, amount } = req.body;

  if (!emergencyId || !cycleId || !householdId || !donationId || amount === undefined) {
    return res.status(400).json({
      message: "Emergency ID, cycle ID, household ID, donation ID, and amount are required",
    });
  }
  if (!isValidObjectId(emergencyId) || !isValidObjectId(donationId)) {
    return res.status(400).json({
      message: "Emergency ID and donation ID must be valid Mongo ObjectIds",
    });
  }
  const requestedAmount = Number(amount);
  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    return res.status(400).json({ message: "Amount must be a positive number" });
  }
  const normalizedCycleId = cycleId.toString().trim().toUpperCase();
  const normalizedHouseholdId = householdId.toString().trim().toUpperCase();

  try {
    const emergency = await Emergency.findById(emergencyId).lean();
    if (!emergency) {
      return res.status(404).json({ message: "Emergency not found" });
    }

    const activeCycle = await AidCycle.findOne({
      emergencyId,
      cycleId: normalizedCycleId,
      status: "ACTIVE",
    }).lean();
    if (!activeCycle) {
      return res.status(400).json({ message: "No active aid cycle found for this emergency" });
    }

    const beneficiary = await Beneficiary.findOne({
      status: "APPROVED",
      householdId: normalizedHouseholdId,
    })
      .select("_id householdId")
      .lean();
    if (!beneficiary) {
      return res.status(404).json({ message: "Beneficiary not found for this household ID" });
    }
    console.log("Selected beneficiary._id:", beneficiary._id);
    console.log("HouseholdId used:", normalizedHouseholdId);

    const donation = await Donation.findOne({
      _id: donationId,
      emergencyId,
      paymentStatus: "SUCCESS",
    });
    if (!donation) {
      return res.status(404).json({
        message: "SUCCESS donation not found for this emergency",
      });
    }
    console.log("DonationId used:", donation._id);

    const claimId = `${emergencyId}:${normalizedHouseholdId}:${activeCycle.cycleId}`;
    const existingClaim = await Aid.findOne({ claimId }).lean();
    if (existingClaim) {
      return res.status(400).json({
        message: "Household already received aid in this cycle.",
      });
    }

    const donationPoolSummary = await buildDonationPoolSummary(emergencyId);
    const donationSummary = donationPoolSummary.donations.find(
      (entry) => entry.donationId.toString() === donation._id.toString()
    );
    const remainingAmount = Number(donationSummary?.remainingAmount ?? donation.amount ?? 0);

    if (remainingAmount < requestedAmount) {
      return res.status(400).json({ message: "Not enough remaining donation funds." });
    }

    const chainResult = await blockchain.createAidClaim({
      claimId,
      emergencyId,
      aidCycle: activeCycle.cycleId,
      householdId: normalizedHouseholdId,
      donationId: donation._id,
      amount: requestedAmount,
    });

    const createdAid = await Aid.create({
      beneficiaryId: beneficiary._id,
      emergencyId,
      donationId: donation._id,
      householdId: normalizedHouseholdId,
      aidCycle: activeCycle.cycleId,
      claimId,
      amountAllocated: requestedAmount,
      allocatedAmount: requestedAmount,
      aidStatus: "ALLOCATED",
      blockchainHash: chainResult.ledgerHash,
      onChainTxId: chainResult.txId,
    });
    console.log("Created Aid._id:", createdAid._id);
    console.log("Created Aid.beneficiaryId:", createdAid.beneficiaryId);

    donation.onChainTxId = chainResult.txId;
    await donation.save();

    return res.status(200).json({
      message: "Aid distributed successfully",
      newAllocations: 1,
      aid: createdAid,
      donationRemainingAmount: Math.max(0, remainingAmount - requestedAmount),
    });
  } catch (err) {
    console.error("DISTRIBUTE AID ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ================= DISTRIBUTION SUMMARY ================= */
exports.getDistributionSummary = async (req, res) => {
  const { emergencyId } = req.params;
  if (!emergencyId) {
    return res.status(400).json({ message: "Emergency ID is required" });
  }
  if (!isValidObjectId(emergencyId)) {
    return res.status(400).json({ message: "Emergency ID must be a valid Mongo ObjectId" });
  }

  try {
    const emergency = await Emergency.findById(emergencyId).lean();
    if (!emergency) {
      return res.status(404).json({ message: "Emergency not found" });
    }

    const donationPoolSummary = await buildDonationPoolSummary(emergencyId);

    return res.status(200).json({
      ...donationPoolSummary,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* ================= AID ALLOCATION LIST ================= */
exports.getAidAllocations = async (req, res) => {
  const { emergencyId } = req.query;

  if (emergencyId && !isValidObjectId(emergencyId)) {
    return res.status(400).json({ message: "Emergency ID must be a valid Mongo ObjectId" });
  }

  try {
    const query = emergencyId ? { emergencyId } : {};
    const aids = await Aid.find(query)
      .select("beneficiaryId householdId aidCycle aidStatus emergencyId amountAllocated allocatedAmount donationId")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json(aids);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* ================= CYCLE SUMMARY ================= */
exports.getCycleSummary = async (req, res) => {
  const { emergencyId, cycleId } = req.params;
  if (!emergencyId || !cycleId) {
    return res.status(400).json({ message: "Emergency ID and cycle ID are required" });
  }
  if (!isValidObjectId(emergencyId)) {
    return res.status(400).json({ message: "Emergency ID must be a valid Mongo ObjectId" });
  }

  const normalizedCycleId = cycleId.toString().trim().toUpperCase();

  try {
    const emergency = await Emergency.findById(emergencyId).lean();
    if (!emergency) {
      return res.status(404).json({ message: "Emergency not found" });
    }

    const aidMatch = {
      emergencyId: new mongoose.Types.ObjectId(emergencyId),
      aidCycle: normalizedCycleId,
    };

    const [totals] = await Aid.aggregate([
      { $match: aidMatch },
      {
        $group: {
          _id: null,
          totalAllocations: { $sum: 1 },
          totalAllocatedAmount: { $sum: "$amountAllocated" },
          deliveredCount: {
            $sum: {
              $cond: [{ $eq: ["$aidStatus", "DELIVERED"] }, 1, 0],
            },
          },
          allocatedCount: {
            $sum: {
              $cond: [{ $eq: ["$aidStatus", "ALLOCATED"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const [beneficiaryIds, donationIds] = await Promise.all([
      Aid.distinct("beneficiaryId", aidMatch),
      Aid.distinct("donationId", aidMatch),
    ]);

    return res.status(200).json({
      cycleId: normalizedCycleId,
      totalAllocations: totals?.totalAllocations || 0,
      totalAllocatedAmount: totals?.totalAllocatedAmount || 0,
      beneficiariesServed: beneficiaryIds.filter(Boolean).length,
      distinctDonationCount: donationIds.filter(Boolean).length,
      deliveredCount: totals?.deliveredCount || 0,
      allocatedCount: totals?.allocatedCount || 0,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* ================= RECONCILIATION ================= */
exports.getReconciliation = async (req, res) => {
  const { emergencyId } = req.params;
  if (!emergencyId) {
    return res.status(400).json({ message: "Emergency ID is required" });
  }
  if (!isValidObjectId(emergencyId)) {
    return res.status(400).json({ message: "Emergency ID must be a valid Mongo ObjectId" });
  }

  try {
    const emergency = await Emergency.findById(emergencyId).lean();
    if (!emergency) {
      return res.status(404).json({ message: "Emergency not found" });
    }

    const [successStats, allocatedStats, totalAidRecords, servedBeneficiaryIds, totalProofsSubmitted] =
      await Promise.all([
        Donation.aggregate([
          {
            $match: {
              emergencyId: new mongoose.Types.ObjectId(emergencyId),
              paymentStatus: "SUCCESS",
            },
          },
          {
            $group: {
              _id: null,
              totalSuccessDonations: { $sum: 1 },
              totalSuccessAmount: { $sum: "$amount" },
            },
          },
        ]),
        Aid.aggregate([
          {
            $match: {
              emergencyId: new mongoose.Types.ObjectId(emergencyId),
            },
          },
          {
            $group: {
              _id: null,
              totalAllocatedAmount: { $sum: "$amountAllocated" },
            },
          },
        ]),
        Aid.countDocuments({ emergencyId }),
        Aid.distinct("beneficiaryId", { emergencyId }),
        Proof.countDocuments({ emergencyId }),
      ]);

    const totalSuccessDonations = successStats[0]?.totalSuccessDonations || 0;
    const totalSuccessAmount = successStats[0]?.totalSuccessAmount || 0;
    const totalAllocatedAmount = allocatedStats[0]?.totalAllocatedAmount || 0;
    const unallocatedAmount = totalSuccessAmount - totalAllocatedAmount;

    return res.status(200).json({
      totalSuccessDonations,
      totalSuccessAmount,
      totalAllocatedAmount,
      unallocatedAmount,
      totalBeneficiariesServed: servedBeneficiaryIds.filter(Boolean).length,
      totalAidRecords,
      totalProofsSubmitted,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* ================= UPLOAD PROOF ================= */
exports.uploadProof = async (req, res) => {
  console.log("uploadProof req.file:", req.file);
  console.log("uploadProof req.body:", req.body);

  const { aidId, description, proofData } = req.body;
  const fileUrl = req.file?.path;

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  if (!aidId || !description || !fileUrl) {
    return res.status(400).json({ message: "Aid ID, description, and proof file are required" });
  }
  if (!isValidObjectId(aidId)) {
    return res.status(400).json({ message: "Aid ID must be a valid Mongo ObjectId" });
  }

  try {
    const aid = await Aid.findById(aidId);
    if (!aid) {
      return res.status(404).json({ message: "Aid record not found" });
    }
    if (aid.aidStatus !== "ALLOCATED") {
      return res.status(400).json({ message: "Proof can only be uploaded for ALLOCATED aid" });
    }

    const proofSource = proofData || `${fileUrl}|${description}|${aid.claimId}`;
    const proofHash = crypto
      .createHash("sha256")
      .update(proofSource)
      .digest("hex");

    const proof = new Proof({
      emergencyId: aid.emergencyId,
      aidCycle: aid.aidCycle,
      description,
      fileUrl,
      proofHash,
      uploadedBy: req.user?.id,
    });

    await proof.save();
    aid.proofHash = proofHash;
    aid.proofUrl = fileUrl;
    aid.aidStatus = "DELIVERED";
    await aid.save();

    await blockchain.submitProofHash({
      claimId: aid.claimId,
      proofHash,
    });

    res.json({
      message: "Proof uploaded successfully",
      proofHash,
      proofId: proof._id,
      aidId: aid._id,
    });
  } catch (err) {
    console.error("UPLOAD PROOF ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ================= START AID CYCLE ================= */
exports.startAidCycle = async (req, res) => {
  const { emergencyId, cycleId } = req.body;
  if (!emergencyId || !cycleId) {
    return res.status(400).json({ message: "Emergency ID and cycle ID are required" });
  }
  if (!isValidObjectId(emergencyId)) {
    return res.status(400).json({ message: "Emergency ID must be a valid Mongo ObjectId" });
  }

  const normalizedCycleId = cycleId.toString().trim().toUpperCase();
  try {
    const emergency = await Emergency.findById(emergencyId).lean();
    if (!emergency) {
      return res.status(404).json({ message: "Emergency not found" });
    }

    const alreadyActive = await AidCycle.findOne({ emergencyId, status: "ACTIVE" }).lean();
    if (alreadyActive) {
      return res.status(200).json({
        message: "Cycle already active",
        status: "ACTIVE",
        cycleId: alreadyActive.cycleId,
      });
    }

    const created = await AidCycle.create({
      emergencyId,
      cycleId: normalizedCycleId,
      status: "ACTIVE",
      startedAt: new Date(),
    });

    res.status(200).json({
      message: "Cycle started successfully",
      status: "ACTIVE",
      cycle: created,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Cycle ID already exists for this emergency" });
    }
    res.status(500).json({ error: err.message });
  }
};

/* ================= CLOSE AID CYCLE ================= */
exports.closeAidCycle = async (req, res) => {
  const { emergencyId } = req.body;
  if (!emergencyId) {
    return res.status(400).json({ message: "Emergency ID is required" });
  }
  if (!isValidObjectId(emergencyId)) {
    return res.status(400).json({ message: "Emergency ID must be a valid Mongo ObjectId" });
  }

  try {
    const emergency = await Emergency.findById(emergencyId).lean();
    if (!emergency) {
      return res.status(404).json({ message: "Emergency not found" });
    }

    const cycle = await AidCycle.findOne({ emergencyId, status: "ACTIVE" });
    if (!cycle) {
      return res.status(200).json({
        message: "No active cycle to close",
        status: "NONE",
      });
    }

    cycle.status = "CLOSED";
    cycle.closedAt = new Date();
    await cycle.save();

    res.status(200).json({
      message: "Cycle closed successfully",
      status: "CLOSED",
      cycleId: cycle.cycleId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET ACTIVE AID CYCLE STATUS ================= */
exports.getAidCycleStatus = async (req, res) => {
  const { emergencyId } = req.params;
  if (!emergencyId) {
    return res.status(400).json({ message: "Emergency ID is required" });
  }
  if (!isValidObjectId(emergencyId)) {
    return res.status(400).json({ message: "Emergency ID must be a valid Mongo ObjectId" });
  }

  try {
    const emergency = await Emergency.findById(emergencyId).lean();
    if (!emergency) {
      return res.status(404).json({ message: "Emergency not found" });
    }

    const activeCycle = await AidCycle.findOne({ emergencyId, status: "ACTIVE" }).lean();
    if (!activeCycle) {
      return res.status(200).json({ status: "NONE" });
    }

    return res.status(200).json({
      status: "ACTIVE",
      cycleId: activeCycle.cycleId,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* ================= GET AID CYCLES ================= */
exports.getAidCyclesByEmergency = async (req, res) => {
  const { emergencyId } = req.params;
  if (!emergencyId) {
    return res.status(400).json({ message: "Emergency ID is required" });
  }
  if (!isValidObjectId(emergencyId)) {
    return res.status(400).json({ message: "Emergency ID must be a valid Mongo ObjectId" });
  }

  try {
    const emergency = await Emergency.findById(emergencyId).lean();
    if (!emergency) {
      return res.status(404).json({ message: "Emergency not found" });
    }

    const cycles = await AidCycle.find({ emergencyId }).sort({ createdAt: -1 });
    res.json(cycles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

