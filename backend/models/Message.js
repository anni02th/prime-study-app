const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
})

messageSchema.post("save", async (doc) => {
  // Update the lastMessage in the chat when a new message is saved
  const { chatId, sender, text, timestamp } = doc

  try {
    await mongoose.model("Chat").findByIdAndUpdate(chatId, {
      lastMessage: { text, sender, timestamp },
      updatedAt: Date.now(),
    })
  } catch (err) {
    console.error("Error updating chat with last message:", err)
  }
})

module.exports = mongoose.model("Message", messageSchema)

