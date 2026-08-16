const path = require("path");
const mongoose = require("../backend/node_modules/mongoose");
const dotenv = require("../backend/node_modules/dotenv");

dotenv.config({ path: path.resolve(__dirname, "../backend/.env") });

const User = require("../backend/src/models/User");
const Beneficiary = require("../backend/src/models/Beneficiary");
const Donation = require("../backend/src/models/Donation");
const Aid = require("../backend/src/models/Aid");
const Proof = require("../backend/src/models/Proof");
const AidCycle = require("../backend/src/models/AidCycle");
const Emergency = require("../backend/src/models/Emergency");

async function cleanupDatabase() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set in backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);

  try {
    const [
      deletedUsers,
      deletedBeneficiaries,
      deletedDonations,
      deletedAids,
      deletedProofs,
      deletedAidCycles,
      deletedEmergencies,
    ] = await Promise.all([
      User.deleteMany({ role: { $in: ["DONOR", "BENEFICIARY"] } }),
      Beneficiary.deleteMany({}),
      Donation.deleteMany({}),
      Aid.deleteMany({}),
      Proof.deleteMany({}),
      AidCycle.deleteMany({}),
      Emergency.deleteMany({}),
    ]);

    console.log("Database cleanup complete.");
    console.log(`Users deleted: ${deletedUsers.deletedCount}`);
    console.log(`Beneficiaries deleted: ${deletedBeneficiaries.deletedCount}`);
    console.log(`Donations deleted: ${deletedDonations.deletedCount}`);
    console.log(`Aids deleted: ${deletedAids.deletedCount}`);
    console.log(`Proofs deleted: ${deletedProofs.deletedCount}`);
    console.log(`Aid cycles deleted: ${deletedAidCycles.deletedCount}`);
    console.log(`Emergencies deleted: ${deletedEmergencies.deletedCount}`);
    console.log("Admin users were preserved.");
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
}

cleanupDatabase()
  .catch((error) => {
    console.error("Cleanup failed:", error.message);
    process.exitCode = 1;
  });
