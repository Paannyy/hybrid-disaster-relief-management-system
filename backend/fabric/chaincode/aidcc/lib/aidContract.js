"use strict";

const { Contract } = require("fabric-contract-api");
const crypto = require("crypto");

class AidContract extends Contract {
  _claimKey(claimId) {
    return `CLAIM_${claimId}`;
  }

  async _claimExists(ctx, claimId) {
    const data = await ctx.stub.getState(this._claimKey(claimId));
    return !!(data && data.length > 0);
  }

  _requireNonEmpty(value, fieldName) {
    if (!value || !value.toString().trim()) {
      throw new Error(`${fieldName} is required`);
    }
  }

  async CreateAidClaim(ctx, claimId, emergencyId, aidCycle, householdId, donationId, amount) {
    this._requireNonEmpty(claimId, "claimId");
    this._requireNonEmpty(emergencyId, "emergencyId");
    this._requireNonEmpty(aidCycle, "aidCycle");
    this._requireNonEmpty(householdId, "householdId");
    this._requireNonEmpty(amount, "amount");

    if (await this._claimExists(ctx, claimId)) {
      throw new Error(`Claim already exists: ${claimId}`);
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      throw new Error("amount must be a positive number");
    }

    const txId = ctx.stub.getTxID();
    const ledgerHash = crypto
      .createHash("sha256")
      .update(
        `${claimId}|${emergencyId}|${aidCycle}|${householdId}|${donationId || ""}|${amount}|${txId}`
      )
      .digest("hex");

    const claim = {
      claimId: claimId.toString(),
      emergencyId: emergencyId.toString(),
      aidCycle: aidCycle.toString().toUpperCase(),
      householdId: householdId.toString().toUpperCase(),
      donationId: (donationId || "").toString(),
      amount: amount.toString(),
      claimTxId: txId,
      ledgerHash,
      proofHash: null,
      proofTxId: null,
      status: "ALLOCATED",
      createdAt: new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString(),
      updatedAt: new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString(),
    };

    await ctx.stub.putState(this._claimKey(claimId), Buffer.from(JSON.stringify(claim)));

    return JSON.stringify({
      claimId: claim.claimId,
      txId,
      ledgerHash,
      aidCycle: claim.aidCycle,
      householdId: claim.householdId,
      status: claim.status,
      createdAt: claim.createdAt,
    });
  }

  async SubmitProofHash(ctx, claimId, proofHash) {
    this._requireNonEmpty(claimId, "claimId");
    this._requireNonEmpty(proofHash, "proofHash");

    const claimBytes = await ctx.stub.getState(this._claimKey(claimId));
    if (!claimBytes || claimBytes.length === 0) {
      throw new Error(`Claim not found: ${claimId}`);
    }

    const claim = JSON.parse(claimBytes.toString());
    const txId = ctx.stub.getTxID();
    claim.proofHash = proofHash.toString();
    claim.proofTxId = txId;
    claim.status = "DELIVERED";
    claim.updatedAt = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();

    await ctx.stub.putState(this._claimKey(claimId), Buffer.from(JSON.stringify(claim)));

    return JSON.stringify({
      claimId: claim.claimId,
      txId,
      proofHash: claim.proofHash,
      updatedAt: claim.updatedAt,
    });
  }

  async ReadClaim(ctx, claimId) {
    this._requireNonEmpty(claimId, "claimId");
    const claimBytes = await ctx.stub.getState(this._claimKey(claimId));
    if (!claimBytes || claimBytes.length === 0) {
      return "";
    }
    return claimBytes.toString();
  }
}

module.exports = AidContract;

