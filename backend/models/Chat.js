const mongoose = require("mongoose")

const chatSchema = new mongoose.Schema({
  title: { type: String, required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  lastMessage: {
    text: { type: String },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    timestamp: { type: Date },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model("Chat", chatSchema)

