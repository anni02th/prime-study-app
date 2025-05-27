const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "advisor", "student", "user"], default: "user" },
  avatar: { type: String }, // URL to avatar image (S3 or local path)
  phone: { type: String },
  address: { type: String },
  bio: { type: String },
  settings: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    darkMode: { type: Boolean, default: false },
    language: { type: String, default: "en" },
    timezone: { type: String, default: "UTC" },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("User", userSchema)
