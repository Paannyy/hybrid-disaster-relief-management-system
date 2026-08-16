const crypto = require("crypto");

const claims = new Map();

const newTxId = (prefix) => `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

exports.createAidClaim = async ({
  claimId,
  emergencyId,
  aidCycle,
  householdId,
  donationId,
  amount,
}) => {
  const txId = newTxId("SIMTX");
  const ledgerHash = crypto
    .createHash("sha256")
    .update(`${claimId}|${emergencyId}|${aidCycle}|${householdId}|${donationId}|${amount}|${txId}`)
    .digest("hex");

  const record = {
    claimId,
    emergencyId: emergencyId.toString(),
    aidCycle: aidCycle.toString(),
    householdId: householdId.toString(),
    donationId: donationId?.toString?.() || null,
    amount: amount.toString(),
    claimTxId: txId,
    ledgerHash,
    proofHash: null,
    proofTxId: null,
    status: "ALLOCATED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  claims.set(claimId, record);

  return {
    txId,
    ledgerHash,
  };
};

exports.submitProofHash = async ({ claimId, proofHash }) => {
  const txId = newTxId("SIMPROOF");
  const existing = claims.get(claimId);
  if (!existing) {
    throw new Error(`Claim not found: ${claimId}`);
  }

  existing.proofHash = proofHash;
  existing.proofTxId = txId;
  existing.status = "DELIVERED";
  existing.updatedAt = new Date().toISOString();
  claims.set(claimId, existing);

  return { txId };
};

exports.getClaim = async ({ claimId }) => {
  return claims.get(claimId) || null;
};
