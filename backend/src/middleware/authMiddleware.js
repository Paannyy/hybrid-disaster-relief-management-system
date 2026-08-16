const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* ================= VERIFY TOKEN ================= */
const authMiddleware = async (req, res, next) => {
  console.log("Auth middleware HIT");

  const header = req.headers.authorization;

  if (!header) {
    console.log("No Authorization header");
    return res.status(401).json({ message: "No token provided" });
  }

  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    const user = await User.findById(decoded.id).select("_id role isActive active status").lean();
    if (
      !user ||
      user.isActive === false ||
      user.active === false ||
      ["INACTIVE", "DISABLED", "DELETED"].includes(user.status)
    ) {
      return res.status(403).json({ message: "Invalid token" });
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
    };
    next();
  } catch (err) {
    console.log("JWT ERROR:", err.message);
    return res.status(403).json({ message: "Invalid token" });
  }
};

/* ================= ADMIN CHECK ================= */
const adminOnly = (req, res, next) => {
  console.log("Admin middleware HIT");
  console.log("req.user:", req.user);

  if (!req.user || req.user.role !== "ADMIN") {
    console.log("Role failed check");
    return res.status(403).json({ message: "Admin access only" });
  }

  next();
};

/* ================= BENEFICIARY CHECK ================= */
const beneficiaryOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "BENEFICIARY") {
    return res.status(403).json({ message: "Beneficiary access only" });
  }

  next();
};

/* ================= DONOR CHECK ================= */
const donorOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "DONOR") {
    return res.status(403).json({ message: "Donor access only" });
  }

  next();
};

module.exports = {
  authMiddleware,
  adminOnly,
  beneficiaryOnly,
  donorOnly,
};
