require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();   // ⇦ called here
    console.log("MongoDB Connected Successfully");  // ⇦ and this one
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    process.exit(1);  // Stop server if DB fails
  }
}

startServer();
