const express = require("express")
const ApplicationChat = require("../models/ApplicationChat")
const Application = require("../models/Application")
const User = require("../models/User")
const { authenticateToken } = require("../config/auth")

const router = express.Router()

// Get chat for a specific application
router.get("/:applicationId", authenticateToken, async (req, res) => {
  try {
    const { applicationId } = req.params

    // Find or create chat for this application
    let chat = await ApplicationChat.findOne({ applicationId }).populate("messages.sender", "name avatar role")

    if (!chat) {
      // Get application details to create a new chat
      const application = await Application.findById(applicationId)
      if (!application) {
        return res.status(404).json({ message: "Application not found" })
      }

      chat = await ApplicationChat.create({
        applicationId,
        studentId: application.studentId,
        messages: [],
      })
    }

    res.json(chat)
  } catch (err) {
    console.error("Error fetching application chat:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Send a message in an application chat
router.post("/:applicationId/messages", authenticateToken, async (req, res) => {
  try {
    const { applicationId } = req.params
    const { text } = req.body

    // Get user details
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Find or create chat for this application
    let chat = await ApplicationChat.findOne({ applicationId })

    if (!chat) {
      // Get application details to create a new chat
      const application = await Application.findById(applicationId)
      if (!application) {
        return res.status(404).json({ message: "Application not found" })
      }

      chat = await ApplicationChat.create({
        applicationId,
        studentId: application.studentId,
        messages: [],
      })
    }

    // Add message to chat
    const newMessage = {
      sender: req.user.id,
      senderName: user.name,
      senderRole: user.role,
      text,
      timestamp: new Date(),
      read: false,
    }

    chat.messages.push(newMessage)
    chat.updatedAt = new Date()
    await chat.save()

    // Return the new message with populated sender
    const populatedMessage = {
      ...newMessage,
      sender: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    }

    res.status(201).json(populatedMessage)
  } catch (err) {
    console.error("Error sending message:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Mark all messages as read
router.put("/:applicationId/read", authenticateToken, async (req, res) => {
  try {
    const { applicationId } = req.params

    const chat = await ApplicationChat.findOne({ applicationId })

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" })
    }

    // Mark messages from others as read
    chat.messages.forEach((message) => {
      if (message.sender.toString() !== req.user.id) {
        message.read = true
      }
    })

    await chat.save()

    res.json({ message: "Messages marked as read" })
  } catch (err) {
    console.error("Error marking messages as read:", err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router

