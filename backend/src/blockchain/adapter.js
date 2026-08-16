const mockAdapter = require("./mockAdapter");
const fabricAdapter = require("./fabricAdapter");

const provider = (process.env.BLOCKCHAIN_PROVIDER || "mock").toLowerCase();
const fallbackToMock =
  (process.env.BLOCKCHAIN_FALLBACK_TO_MOCK || "true").toLowerCase() !== "false";

let adapter = mockAdapter;

if (provider === "fabric") {
  adapter = {
    createAidClaim: async (payload) => {
      try {
        return await fabricAdapter.createAidClaim(payload);
      } catch (err) {
        if (!fallbackToMock) throw err;
        console.warn("[blockchain] Fabric createAidClaim failed, falling back to mock:", err.message);
        return mockAdapter.createAidClaim(payload);
      }
    },
    submitProofHash: async (payload) => {
      try {
        return await fabricAdapter.submitProofHash(payload);
      } catch (err) {
        if (!fallbackToMock) throw err;
        console.warn("[blockchain] Fabric submitProofHash failed, falling back to mock:", err.message);
        return mockAdapter.submitProofHash(payload);
      }
    },
    getClaim: async (payload) => {
      try {
        return await fabricAdapter.getClaim(payload);
      } catch (err) {
        if (!fallbackToMock) throw err;
        console.warn("[blockchain] Fabric getClaim failed, falling back to mock:", err.message);
        return mockAdapter.getClaim(payload);
      }
    },
  };
}

module.exports = adapter;
