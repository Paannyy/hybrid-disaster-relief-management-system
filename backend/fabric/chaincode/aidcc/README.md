# aidcc (Starter Chaincode)

Implements backend-aligned functions:
- `CreateAidClaim(claimId, emergencyId, aidCycle, householdId, donationId, amount)`
- `SubmitProofHash(claimId, proofHash)`
- `ReadClaim(claimId)`

## Install

```bash
cd backend/fabric/chaincode/aidcc
npm install
```

## Notes

- Return payloads are JSON strings that match `backend/src/blockchain/fabricAdapter.js`.
- `claimId` is expected in format: `HOUSEHOLD_ID:AID_CYCLE`.
- Duplicate claim IDs are rejected.

