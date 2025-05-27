const express = require("express")
const Chat = require("../models/Chat")
const Message = require("../models/Message")
const User = require("../models/User")
const { authenticateToken } = require("../config/auth")
const mongoose = require("mongoose")

const router = express.Router()

// Get all chats for current user
router.get("/", authenticateToken, async (req, res) => {
  try {
    // Validate user ID
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated properly" })
    }

    const chats = await Chat.find({
      participants: req.user.id,
    })
      .populate("participants", "name avatar")
      .populate("lastMessage.sender", "name")
      .sort({ updatedAt: -1 })

    // Format chats for client
    const formattedChats = chats.map((chat) => {
      // Count unread messages
      const unreadCount = 0 // This will be implemented in a separate query

      return {
        id: chat._id,
        title: chat.title,
        participants: chat.participants,
        lastMessage: chat.lastMessage
          ? {
              text: chat.lastMessage.text,
              sender:
                chat.lastMessage.sender && chat.lastMessage.sender._id.toString() === req.user.id ? "user" : "other",
              timestamp: chat.lastMessage.timestamp,
            }
          : null,
        unreadCount,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      }
    })

    res.json(formattedChats)
  } catch (err) {
    console.error("Chats fetch error:", err)
    res.status(500).json({ message: "Server error", error: err.message })
  }
})

// Get a specific chat
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    // Validate chat ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid chat ID format" })
    }

    const chat = await Chat.findById(req.params.id).populate("participants", "name avatar")

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" })
    }

    // Check if user is a participant
    if (!chat.participants.some((p) => p._id.toString() === req.user.id)) {
      return res.status(403).json({ message: "Forbidden" })
    }

    res.json({
      id: chat._id,
      title: chat.title,
      participants: chat.participants,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    })
  } catch (err) {
    console.error("Chat fetch error:", err)
    res.status(500).json({ message: "Server error", error: err.message })
  }
})

// Create a new chat
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, participantIds } = req.body

    // Validate participants
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ message: "At least one participant is required" })
    }

    // Ensure current user is included in participants
    const allParticipantIds = [...new Set([req.user.id, ...participantIds])]

    // Check if all participants exist
    const participants = await User.find({ _id: { $in: allParticipantIds } })
    if (participants.length !== allParticipantIds.length) {
      return res.status(400).json({ message: "One or more participants do not exist" })
    }

    // Check if a chat with the same participants already exists
    const existingChat = await Chat.findOne({
      participants: { $all: allParticipantIds, $size: allParticipantIds.length },
    })

    if (existingChat) {
      return res.json({
        id: existingChat._id,
        title: existingChat.title,
        participants: existingChat.participants,
        createdAt: existingChat.createdAt,
        updatedAt: existingChat.updatedAt,
      })
    }

    // Create a default title if not provided
    let chatTitle = title
    if (!chatTitle) {
      // Create title from participant names
      const participantNames = participants.filter((p) => p._id.toString() !== req.user.id).map((p) => p.name)

      chatTitle = participantNames.join(", ")
      if (!chatTitle) chatTitle = "New Chat"
    }

    const newChat = await Chat.create({
      title: chatTitle,
      participants: allParticipantIds,
    })

    const populatedChat = await Chat.findById(newChat._id).populate("participants", "name avatar")

    res.status(201).json({
      id: populatedChat._id,
      title: populatedChat.title,
      participants: populatedChat.participants,
      createdAt: populatedChat.createdAt,
      updatedAt: populatedChat.updatedAt,
    })
  } catch (err) {
    console.error("Chat creation error:", err)
    res.status(500).json({ message: "Server error", error: err.message })
  }
})

// Get messages for a chat
router.get("/:id/messages", authenticateToken, async (req, res) => {
  try {
    // Validate chat ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid chat ID format" })
    }

    const chat = await Chat.findById(req.params.id)

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" })
    }

    // Check if user is a participant
    if (!chat.participants.some((p) => p.toString() === req.user.id)) {
      return res.status(403).json({ message: "Forbidden" })
    }

    const query = { chatId: req.params.id }

    // If after parameter is provided, get only newer messages
    if (req.query.after) {
      query._id = { $gt: req.query.after }
    }

    const messages = await Message.find(query).sort({ timestamp: 1 }).populate("sender", "name avatar")

    // Format messages for client
    const formattedMessages = messages.map((message) => ({
      id: message._id,
      text: message.text,
      sender: message.sender._id.toString() === req.user.id ? "user" : "other",
      senderName: message.sender.name,
      senderAvatar: message.sender.avatar,
      timestamp: message.timestamp,
      read: message.read,
    }))

    // Mark messages as read
    await Message.updateMany(
      {
        chatId: req.params.id,
        sender: { $ne: req.user.id },
        read: false,
      },
      { read: true },
    )

    res.json(formattedMessages)
  } catch (err) {
    console.error("Messages fetch error:", err)
    res.status(500).json({ message: "Server error", error: err.message })
  }
})

// Send a message in a chat
router.post("/:id/messages", authenticateToken, async (req, res) => {
  try {
    const { text } = req.body
    const chatId = req.params.id

    // Validate chat ID
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chat ID format" })
    }

    const chat = await Chat.findById(chatId)

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" })
    }

    // Check if user is a participant
    if (!chat.participants.some((p) => p.toString() === req.user.id)) {
      return res.status(403).json({ message: "Forbidden" })
    }

    const newMessage = await Message.create({
      chatId,
      sender: req.user.id,
      text,
      read: false,
    })

    const populatedMessage = await Message.findById(newMessage._id).populate("sender", "name avatar")

    // Update the chat's lastMessage
    chat.lastMessage = {
      text,
      sender: req.user.id,
      timestamp: new Date(),
    }
    chat.updatedAt = new Date()
    await chat.save()

    // Format message for client
    const formattedMessage = {
      id: populatedMessage._id,
      text: populatedMessage.text,
      sender: "user",
      senderName: populatedMessage.sender.name,
      senderAvatar: populatedMessage.sender.avatar,
      timestamp: populatedMessage.timestamp,
      read: populatedMessage.read,
    }

    res.status(201).json(formattedMessage)
  } catch (err) {
    console.error("Message creation error:", err)
    res.status(500).json({ message: "Server error", error: err.message })
  }
})

module.exports = router
