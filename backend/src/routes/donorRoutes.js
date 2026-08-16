// const router = require("express").Router();
// const { authMiddleware, donorOnly } = require("../middleware/authMiddleware");

// const c = require("../controllers/donorController");

// router.get("/emergencies", c.getEmergencies);
// // router.post("/donate", c.donate);
// router.get("/transactions", c.getTransactions);
// router.get("/proofs", c.getProofs);
// router.post("/create-donation", authMiddleware, donorOnly, createDonation);
// router.post("/confirm-payment", authMiddleware, donorOnly, confirmPayment);


// module.exports = router;
const express = require("express");
const router = express.Router();

const { authMiddleware, donorOnly } = require("../middleware/authMiddleware");

const {
  getEmergencies,
  donate,
  getTransactions,
  confirmPayment,
  getDonationTrace,
} = require("../controllers/donorController");

const authOrPaymentWebhook = (req, res, next) => {
  if (req.headers["x-payment-webhook-secret"]) {
    return next();
  }

  return authMiddleware(req, res, next);
};

router.get("/emergencies", getEmergencies);
// two names supported for backwards compatibility
router.post("/donate", authMiddleware, donorOnly, donate);
router.post("/create-donation", authMiddleware, donorOnly, donate);
router.post("/confirm-payment", authOrPaymentWebhook, confirmPayment);
router.get("/transactions", authMiddleware, getTransactions);
router.get("/trace/:donationId", authMiddleware, getDonationTrace);

module.exports = router;

