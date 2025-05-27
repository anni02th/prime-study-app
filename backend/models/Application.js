const mongoose = require("mongoose")

const applicationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  university: { type: String, required: true },
  program: { type: String, required: true },
  intake: { type: String },
  applicationFee: { type: Number },
  status: { type: String, default: "Pending" },
  statusColor: { type: String, default: "#f3f4f6" }, // Default light gray background
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Document" }],
  countryCode: { type: String },
  starred: { type: Boolean, default: false }, // Added starred field
  portalName: { type: String }, // New field for portal name
  potalId: { type: String }, // New field for total ID
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Application", applicationSchema)
