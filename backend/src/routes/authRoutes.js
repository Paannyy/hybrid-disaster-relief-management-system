const express = require("express");
const router = express.Router();
const {
  registerUser,
  registerBeneficiaryUser,
  loginUser,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/register-beneficiary", registerBeneficiaryUser);
router.post("/login", loginUser);

module.exports = router;
