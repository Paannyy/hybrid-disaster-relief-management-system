const Beneficiary = require("../models/Beneficiary");
const Proof = require("../models/Proof");
const Aid = require("../models/Aid");

const generateNextHouseholdId = async () => {
  const beneficiaries = await Beneficiary.find({
    householdId: { $regex: /^HH-\d+$/ },
  })
    .select("householdId")
    .lean();

  const highestAssignedNumber = beneficiaries.reduce((maxValue, beneficiary) => {
    const match = beneficiary.householdId?.match(/^HH-(\d+)$/);
    if (!match) return maxValue;
    const numericValue = Number(match[1]);
    return Number.isFinite(numericValue) ? Math.max(maxValue, numericValue) : maxValue;
  }, 0);

  return `HH-${String(highestAssignedNumber + 1).padStart(3, "0")}`;
};

/* ================= REGISTER BENEFICIARY ================= */
/* Status: PENDING */
exports.register = async (req, res) => {
  const userId = req.user?.id;
  const { name, familyMembers, uniqueId, proofUrl } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!name || !familyMembers || !uniqueId) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const normalizedName = name.toString().trim();
    const normalizedUniqueId = uniqueId.toString().trim().toUpperCase();
    const familyMembersNum = Number(familyMembers);
    const normalizedProofUrl = proofUrl ? proofUrl.toString().trim() : "";

    console.log("[BeneficiaryController.register] incoming payload:", {
      userId,
      name: normalizedName,
      familyMembers: familyMembersNum,
      uniqueId: normalizedUniqueId,
      proofUrl: normalizedProofUrl,
    });

    if (normalizedName.length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters" });
    }
    if (!Number.isInteger(familyMembersNum) || familyMembersNum <= 0) {
      return res
        .status(400)
        .json({ message: "Family members must be a positive integer" });
    }
    if (normalizedUniqueId.length < 6 || normalizedUniqueId.length > 30) {
      return res.status(400).json({ message: "Unique ID length is invalid" });
    }

    const existingForUser = await Beneficiary.findOne({ userId });
    if (existingForUser) {
      return res.status(409).json({
        message: "Beneficiary profile already exists for this account",
      });
    }

    // prevent duplicate registration
    const existing = await Beneficiary.findOne({ uniqueId: normalizedUniqueId });
    if (existing) {
      return res.status(409).json({
        message: "Beneficiary already registered",
      });
    }

    const beneficiary = await Beneficiary.create({
      userId,
      name: normalizedName,
      familyMembers: familyMembersNum,
      uniqueId: normalizedUniqueId,
      proofUrl: normalizedProofUrl,
      status: "PENDING",
    });

    return res.status(201).json({
      message: "Registration submitted",
      beneficiaryId: beneficiary._id,
    });
  } catch (err) {
    console.error("[BeneficiaryController.register] save failed:", err);

    if (err?.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Beneficiary already registered" });
    }

    return res.status(500).json({ message: "Failed to register beneficiary" });
  }
};

/* ================= GET BENEFICIARY STATUS ================= */
exports.getStatus = async (req, res) => {
  try {
    const beneficiary = await Beneficiary.findOne({ userId: req.user.id });

    if (!beneficiary) {
      return res.json({ status: "NOT_REGISTERED" });
    }

    res.json(beneficiary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= ADMIN: GET ALL BENEFICIARIES ================= */
exports.getAllBeneficiaries = async (req, res) => {
  try {
    const list = await Beneficiary.find();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= ADMIN: VERIFY BENEFICIARY ================= */
/* Generates permanent IDs */
exports.verifyBeneficiary = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: "Beneficiary ID is required" });
  }

  try {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const beneficiary = await Beneficiary.findById(id);
      if (!beneficiary) {
        return res.status(404).json({ message: "Beneficiary not found" });
      }

      const generatedHouseholdId = await generateNextHouseholdId();

      beneficiary.status = "APPROVED";
      beneficiary.beneficiaryId = beneficiary.beneficiaryId || "BEN-" + Date.now();
      beneficiary.householdId = generatedHouseholdId;

      try {
        await beneficiary.save();

        return res.json({
          message: "Beneficiary verified",
          beneficiary,
        });
      } catch (err) {
        if (err?.code !== 11000) {
          throw err;
        }
      }
    }

    return res.status(409).json({ message: "Failed to generate a unique household ID" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET ALL PROOFS ================= */
exports.getProofs = async (req, res) => {
  try {
    const proofs = await Proof.find();
    res.json(proofs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET AID FOR BENEFICIARY ================= */
// param uniqueId is the ration card / unique identifier stored when the user
// registered on the front end.  This keeps the flow unauthenticated but
// still scoped to one beneficiary record.
exports.getAidForCurrentUser = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    console.log("JWT userId:", req.user?.id);
    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const beneficiary = await Beneficiary.findOne({ userId: currentUserId });
    console.log("Found beneficiary _id:", beneficiary?._id);
    if (!beneficiary) {
      return res.status(404).json({ message: "Beneficiary not found" });
    }

    const aidQuery = {
      beneficiaryId: beneficiary._id,
      aidStatus: { $in: ["ALLOCATED", "DELIVERED"] },
    };
    console.log("Aid.find query used:", aidQuery);
    const aids = await Aid.find(aidQuery).sort({ createdAt: -1 });
    console.log("Aid records returned:", aids.length);
    res.json(aids);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAidStatusForCurrentUser = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const beneficiary = await Beneficiary.findOne({ userId: currentUserId })
      .select("_id")
      .lean();
    if (!beneficiary) {
      return res.status(404).json({ message: "Beneficiary not found" });
    }

    const latestAid = await Aid.findOne({
      beneficiaryId: beneficiary._id,
      aidStatus: { $in: ["ALLOCATED", "DELIVERED"] },
    })
      .sort({ createdAt: -1 })
      .select("aidStatus amountAllocated emergencyId aidCycle blockchainHash createdAt")
      .lean();

    if (!latestAid) {
      return res.json({ status: "PENDING", latestAid: null });
    }

    return res.json({
      status: latestAid.aidStatus,
      latestAid,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
