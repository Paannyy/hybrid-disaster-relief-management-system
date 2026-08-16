let Gateway;
let Wallets;

const state = {
  initialized: false,
  contract: null,
};

const requireSdk = () => {
  if (!Gateway || !Wallets) {
    // Lazy-load to avoid crashing environments where Fabric SDK is not installed yet.
    ({ Gateway, Wallets } = require("fabric-network"));
  }
};

const getConfig = () => {
  const configPath = process.env.FABRIC_CONNECTION_PROFILE;
  const walletPath = process.env.FABRIC_WALLET_PATH;
  const identity = process.env.FABRIC_IDENTITY || "appUser";
  const channel = process.env.FABRIC_CHANNEL || "mychannel";
  const chaincode = process.env.FABRIC_CHAINCODE || "aidcc";

  if (!configPath || !walletPath) {
    throw new Error(
      "Fabric adapter not configured. Set FABRIC_CONNECTION_PROFILE and FABRIC_WALLET_PATH."
    );
  }

  return { configPath, walletPath, identity, channel, chaincode };
};

const getContract = async () => {
  if (state.initialized && state.contract) {
    return state.contract;
  }

  requireSdk();
  const fs = require("fs");
  const path = require("path");
  const { configPath, walletPath, identity, channel, chaincode } = getConfig();

  const ccp = JSON.parse(fs.readFileSync(path.resolve(configPath), "utf8"));
  const wallet = await Wallets.newFileSystemWallet(path.resolve(walletPath));

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity,
    discovery: { enabled: true, asLocalhost: true },
  });

  const network = await gateway.getNetwork(channel);
  state.contract = network.getContract(chaincode);
  state.initialized = true;

  return state.contract;
};

exports.createAidClaim = async ({
  claimId,
  emergencyId,
  aidCycle,
  householdId,
  donationId,
  amount,
}) => {
  const contract = await getContract();
  const resultBuffer = await contract.submitTransaction(
    "CreateAidClaim",
    claimId,
    emergencyId.toString(),
    aidCycle,
    householdId,
    donationId?.toString?.() || "",
    amount.toString()
  );

  let parsed = {};
  try {
    parsed = JSON.parse(resultBuffer.toString() || "{}");
  } catch {
    parsed = {};
  }

  return {
    txId: parsed.txId || null,
    ledgerHash: parsed.ledgerHash || parsed.hash || null,
  };
};

exports.submitProofHash = async ({ claimId, proofHash }) => {
  const contract = await getContract();
  const resultBuffer = await contract.submitTransaction(
    "SubmitProofHash",
    claimId,
    proofHash
  );

  let parsed = {};
  try {
    parsed = JSON.parse(resultBuffer.toString() || "{}");
  } catch {
    parsed = {};
  }

  return { txId: parsed.txId || null };
};

exports.getClaim = async ({ claimId }) => {
  const contract = await getContract();
  const resultBuffer = await contract.evaluateTransaction("ReadClaim", claimId);
  const raw = resultBuffer.toString();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
};
