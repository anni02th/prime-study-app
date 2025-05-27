const express = require("express")
const router = express.Router()
const User = require("../models/User")
const Student = require("../models/Student")
const { authenticateToken, isAdmin } = require("../config/auth")
const upload = require("../config/upload")
const fs = require("fs")
const path = require("path")

// Get all users (admin only)
router.get("/", authenticateToken, async (req, res) => {
  try {
    // Filter by role if provided
    const filter = {}
    if (req.query.role) {
      filter.role = req.query.role
    }

    const users = await User.find(filter).select("-password")
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, address, bio, avatar } = req.body

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update user fields
    if (name) user.name = name
    if (email) user.email = email
    if (phone) user.phone = phone
    if (address) user.address = address
    if (bio) user.bio = bio
    if (avatar) user.avatar = avatar

    const updatedUser = await user.save()

    // If this is a student, update the student profile as well
    if (user.role === "student") {
      const student = await Student.findOne({ userId: user._id })
      if (student) {
        if (name) student.name = name
        if (email) student.email = email
        if (phone) student.contact = phone
        await student.save()
      }
    }

    res.json(updatedUser)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Upload user avatar
router.post("/avatar", authenticateToken, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const user = await User.findById(req.user.id)
    if (!user) {
      // Delete the uploaded file if using local storage
      if (req.file.path && !req.file.location) {
        fs.unlinkSync(req.file.path)
      }
      return res.status(404).json({ message: "User not found" })
    }

    // Delete old avatar if it exists and is a local file
    if (user.avatar && user.avatar.startsWith("/uploads/") && !user.avatar.startsWith("http")) {
      const oldAvatarPath = path.join(__dirname, "..", "..", user.avatar)
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath)
      }
    }

    // Update user avatar - handle both S3 and local storage
    // For S3, use the location property which contains the full URL
    // For local storage, use the path property
    user.avatar = req.file.location || `/${req.file.path.replace(/\\/g, "/")}`
    await user.save()

    // If this is a student, update the student's user reference
    if (user.role === "student") {
      const student = await Student.findOne({ userId: user._id })
      if (student) {
        // No need to update student avatar as it references the user
        await student.save()
      }
    }

    res.json({
      message: "Avatar uploaded successfully",
      avatar: user.avatar,
    })
  } catch (err) {
    console.error("Error uploading avatar:", err)
    // Delete the uploaded file if there was an error and using local storage
    if (req.file && req.file.path && !req.file.location) {
      fs.unlinkSync(req.file.path)
    }
    res.status(500).json({ message: err.message })
  }
})

// Create a new user (admin only)
router.post("/", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role, phone, address, avatar } = req.body

    // Check if user already exists
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Create new user
    const user = new User({
      name,
      email,
      password, // This should be hashed in a real application
      role: role || "user",
      phone,
      address,
      avatar,
    })

    const newUser = await user.save()

    // If creating a student, create student profile
    if (role === "student") {
      const student = new Student({
        name,
        email,
        contact: phone,
        userId: newUser._id,
      })
      await student.save()
    }

    res.status(201).json(newUser)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Update a user (admin only)
router.put("/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, email, role, phone, address, avatar } = req.body

    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update user fields
    if (name) user.name = name
    if (email) user.email = email
    if (role) user.role = role
    if (phone) user.phone = phone
    if (address) user.address = address
    if (avatar) user.avatar = avatar

    const updatedUser = await user.save()

    // If this is a student, update the student profile as well
    if (user.role === "student") {
      const student = await Student.findOne({ userId: user._id })
      if (student) {
        if (name) student.name = name
        if (email) student.email = email
        if (phone) student.contact = phone
        await student.save()
      }
    }

    res.json(updatedUser)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Delete a user (admin only)
router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // If this is a student, delete the student profile as well
    if (user.role === "student") {
      await Student.findOneAndDelete({ userId: user._id })
    }

    await User.findByIdAndDelete(req.params.id)
    res.json({ message: "User deleted" })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
