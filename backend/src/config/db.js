const mongoose = require("mongoose");

const connectDB = async () => {
  console.log("using URI:", process.env.MONGO_URI);
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB error", err);
    process.exit(1);
  }
};

module.exports = connectDB;
