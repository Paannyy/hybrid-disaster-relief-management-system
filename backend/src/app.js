const express = require("express");
const cors = require("cors");

const adminRoutes = require("./routes/adminRoutes");
const donorRoutes = require("./routes/donorRoutes");
const beneficiaryRoutes = require("./routes/beneficiaryRoutes");
const authRoutes = require("./routes/authRoutes");


const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.use("/admin", adminRoutes);
app.use("/donor", donorRoutes);
app.use("/beneficiary", beneficiaryRoutes);
app.use("/auth", authRoutes);



module.exports = app;
