// const mongoose = require("mongoose");

// const schema = new mongoose.Schema(
//   {
//     name: String,
//     familyMembers: Number,
//     uniqueId: { type: String, unique: true },
//     proofUrl: String,
//     status: { type: String, default: "PENDING" },
//     beneficiaryId: String,
//     householdId: String,
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Beneficiary", schema);
// const mongoose = require("mongoose");

// const beneficiarySchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     familyMembers: { type: Number, required: true },
//     uniqueId: { type: String, required: true, unique: true },
//     proofUrl: { type: String },

//     status: {
//       type: String,
//       enum: ["PENDING", "APPROVED"],
//       default: "PENDING",
//     },

//     beneficiaryId: { type: String },
//     householdId: { type: String },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Beneficiary", beneficiarySchema);
const mongoose = require("mongoose");

const beneficiarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    name: {
      type: String,
      required: true,
    },

    familyMembers: {
      type: Number,
      required: true,
    },

    uniqueId: {
      type: String,
      required: true,
      unique: true,
    },

    proofUrl: {
      type: String,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED"],
      default: "PENDING",
    },

    beneficiaryId: {
      type: String,
    },

    householdId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Beneficiary", beneficiarySchema);
