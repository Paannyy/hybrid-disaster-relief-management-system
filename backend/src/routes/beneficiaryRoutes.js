const router = require("express").Router();
const { authMiddleware, beneficiaryOnly } = require("../middleware/authMiddleware");
const c = require("../controllers/beneficiaryController");

/*
  BENEFICIARY ACTIONS
  -------------------
  - Register themselves
  - Check approval / status
*/

router.use(authMiddleware, beneficiaryOnly);

router.post("/register", c.register);
router.get("/status/me", c.getStatus);
router.get("/aid-status", c.getAidStatusForCurrentUser);

// retrieve aid allocated to the logged-in beneficiary
router.get("/aid/me", c.getAidForCurrentUser);

module.exports = router;
