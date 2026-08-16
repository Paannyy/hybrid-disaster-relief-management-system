const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { authMiddleware, adminOnly } = require("../middleware/authMiddleware");


const {
  addEmergency,
  distributeAid,
  uploadProof,
  startAidCycle,
  closeAidCycle,
  getAidCycleStatus,
  getDistributionSummary,
  getAidAllocations,
  getCycleSummary,
  getReconciliation,
  getAidCyclesByEmergency,
} = require("../controllers/adminController");

const {
  getAllBeneficiaries,
  verifyBeneficiary,
} = require("../controllers/beneficiaryController");

const uploadsDir = path.resolve(__dirname, "../../uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

/*
  ================= ADMIN ROUTES =================
  - Manage emergencies
  - View & approve beneficiaries
  - Distribute aid
  - Upload proof
*/

/* ----- Emergency ----- */
// router.post("/add-emergency", addEmergency);

// /* ----- Beneficiary approval ----- */
// router.get("/beneficiaries", getAllBeneficiaries);
// router.post("/verify-beneficiary", verifyBeneficiary);

// /* ----- Aid flow ----- */
// router.post("/distribute-aid", distributeAid);
// router.post("/upload-proof", uploadProof);
router.post("/add-emergency", authMiddleware, adminOnly, addEmergency);
router.get("/beneficiaries", authMiddleware, adminOnly, getAllBeneficiaries);
router.post("/verify-beneficiary", authMiddleware, adminOnly, verifyBeneficiary);
router.post("/aid-cycle/start", authMiddleware, adminOnly, startAidCycle);
router.post("/aid-cycle/close", authMiddleware, adminOnly, closeAidCycle);
router.get("/aid-cycle/status/:emergencyId", authMiddleware, adminOnly, getAidCycleStatus);
router.get("/distribution-summary/:emergencyId", authMiddleware, adminOnly, getDistributionSummary);
router.get("/aid-allocations", authMiddleware, adminOnly, getAidAllocations);
router.get("/cycle-summary/:emergencyId/:cycleId", authMiddleware, adminOnly, getCycleSummary);
router.get("/reconciliation/:emergencyId", authMiddleware, adminOnly, getReconciliation);
router.get("/aid-cycle/:emergencyId", authMiddleware, adminOnly, getAidCyclesByEmergency);
router.post("/distribute-aid", authMiddleware, adminOnly, distributeAid);
router.post("/upload-proof", authMiddleware, adminOnly, upload.single("proof"), uploadProof);


module.exports = router;
