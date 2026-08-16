# Fabric Chaincode Contract Spec (Backend-Aligned)

This spec defines the exact contract between:
- Backend adapter: `backend/src/blockchain/fabricAdapter.js`
- Fabric chaincode (recommended name: `aidcc`)

## Functions

### 1) `CreateAidClaim`

Purpose:
- Create an immutable aid-claim record for one household in one aid cycle.

Invocation type:
- `submitTransaction`

Args (all strings, in exact order):
1. `claimId`
2. `emergencyId`
3. `aidCycle`
4. `householdId`
5. `donationId`
6. `amount`

Backend call source:
- `fabricAdapter.createAidClaim(...)`

Expected chaincode response JSON:
```json
{
  "claimId": "67b7f0...91:HH-101:CYCLE-2026-01",
  "txId": "d5f1...a9",
  "ledgerHash": "a3c1...ef",
  "aidCycle": "CYCLE-2026-01",
  "householdId": "HH-101",
  "status": "ALLOCATED",
  "createdAt": "2026-02-21T12:00:00.000Z"
}
```

Required response fields used by backend:
- `txId`
- `ledgerHash` (or alias `hash`)

Validation rules (recommended in chaincode):
- Reject if `claimId` already exists.
- Reject empty required args.
- Parse `amount` as positive numeric.
- Enforce one-claim-per-household-per-cycle via `claimId` uniqueness.

---

### 2) `SubmitProofHash`

Purpose:
- Attach immutable proof hash to an existing claim.

Invocation type:
- `submitTransaction`

Args (all strings, in exact order):
1. `claimId`
2. `proofHash`

Backend call source:
- `fabricAdapter.submitProofHash(...)`

Expected chaincode response JSON:
```json
{
  "claimId": "67b7f0...91:HH-101:CYCLE-2026-01",
  "txId": "a8b2...44",
  "proofHash": "7e91...0c",
  "updatedAt": "2026-02-21T12:10:00.000Z"
}
```

Required response field used by backend:
- `txId` (optional but recommended)

Validation rules (recommended):
- Reject if claim does not exist.
- Reject empty/invalid hash.

---

### 3) `ReadClaim`

Purpose:
- Read claim details for donor trace/audit.

Invocation type:
- `evaluateTransaction`

Args:
1. `claimId`

Backend call source:
- `fabricAdapter.getClaim(...)`

Expected chaincode response JSON:
```json
{
  "claimId": "67b7f0...91:HH-101:CYCLE-2026-01",
  "emergencyId": "67b7...91",
  "aidCycle": "CYCLE-2026-01",
  "householdId": "HH-101",
  "donationId": "67b8...33",
  "amount": "5000",
  "claimTxId": "d5f1...a9",
  "ledgerHash": "a3c1...ef",
  "proofHash": "7e91...0c",
  "proofTxId": "a8b2...44",
  "status": "DELIVERED",
  "updatedAt": "2026-02-21T12:10:00.000Z"
}
```

If not found:
- Return empty string or error (backend handles both).

## Key Design Notes

- Keep all args/fields as strings in chaincode I/O for adapter compatibility.
- Backend currently maps:
  - `CreateAidClaim.txId` -> Mongo `onChainTxId`
  - `CreateAidClaim.ledgerHash` -> Mongo `blockchainHash`
  - `SubmitProofHash` updates trace visibility
- `claimId` format expected by backend:
  - `EMERGENCY_ID:HOUSEHOLD_ID:AID_CYCLE`
  - Example: `67b7f0...91:HH-101:CYCLE-2026-01`

## Environment Expectations

Set backend `.env` for Fabric mode:
```env
BLOCKCHAIN_PROVIDER=fabric
BLOCKCHAIN_FALLBACK_TO_MOCK=false
FABRIC_CONNECTION_PROFILE=./fabric/connection.json
FABRIC_WALLET_PATH=./fabric/wallet
FABRIC_IDENTITY=appUser
FABRIC_CHANNEL=mychannel
FABRIC_CHAINCODE=aidcc
```
