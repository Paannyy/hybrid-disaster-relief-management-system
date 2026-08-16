const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* ================= REGISTER USER ================= */
exports.registerUser = async (req, res) => {
  let { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  name = name.toString().trim();
  email = email.toString().trim().toLowerCase();
  password = password.toString();

  if (name.length < 2) {
    return res.status(400).json({ message: "Name must be at least 2 characters" });
  }
  if (!email.includes("@")) {
    return res.status(400).json({ message: "Valid email is required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "DONOR",
    });

    res.status(201).json({
      message: "Donor registered",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }
    console.error('REGISTER ERROR', err);
    res.status(500).json({ error: err.message });
  }
};

/* ================= LOGIN USER ================= */
exports.loginUser = async (req, res) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  email = email.toString().trim().toLowerCase();
  password = password.toString();

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (
      user.isActive === false ||
      user.active === false ||
      ["INACTIVE", "DISABLED", "DELETED"].includes(user.status)
    ) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= REGISTER BENEFICIARY USER ================= */
exports.registerBeneficiaryUser = async (req, res) => {
  let { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  name = name.toString().trim();
  email = email.toString().trim().toLowerCase();
  password = password.toString();

  if (name.length < 2) {
    return res.status(400).json({ message: "Name must be at least 2 characters" });
  }
  if (!email.includes("@")) {
    return res.status(400).json({ message: "Valid email is required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "BENEFICIARY",
    });

    res.status(201).json({
      message: "Beneficiary account registered",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }
    console.error("REGISTER BENEFICIARY ERROR", err);
    res.status(500).json({ error: err.message });
  }
};
