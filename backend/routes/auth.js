const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const crypto = require("crypto")
const nodemailer = require("nodemailer")
require("dotenv").config()

const router = express.Router()

// Store reset codes temporarily (in a real app, this would be in a database)
const resetCodes = {}

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

// Initialize database with admin user if none exists
const initializeDatabase = async () => {
  try {
    const adminExists = await User.findOne({ role: "admin" })

    if (!adminExists) {
      const hashedPassword = bcrypt.hashSync("admin123", 10)
      await User.create({
        name: "Admin User",
        email: "admin@primestudy.com",
        password: hashedPassword,
        role: "admin",
      })
      console.log("Admin user created")

      // Create an advisor user
      const advisorExists = await User.findOne({ role: "advisor" })
      if (!advisorExists) {
        const hashedPassword = bcrypt.hashSync("advisor123", 10)
        await User.create({
          name: "Advisor Smith",
          email: "advisor@primestudy.com",
          password: hashedPassword,
          role: "advisor",
        })
        console.log("Advisor user created")
      }
    }
  } catch (err) {
    console.error("Error initializing database:", err)
  }
}

initializeDatabase()

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Invalid email or password" })
    }

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    })

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    })
  } catch (err) {
    console.error("Login error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Register route
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "student" } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" })
    }

    const hashedPassword = bcrypt.hashSync(password, 10)
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    })

    const token = jwt.sign({ id: newUser._id, email: newUser.email, role: newUser.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    })

    // Return a consistent user object structure with both id and _id for compatibility
    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        _id: newUser._id, // Include both formats for compatibility
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    })
  } catch (err) {
    console.error("Registration error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Forgot password route
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body

    // Check if user exists
    const user = await User.findOne({ email })

    // Don't reveal if user exists or not for security
    if (!user) {
      return res
        .status(200)
        .json({ message: "If an account with that email exists, we've sent a password reset code." })
    }

    // Generate a random 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Store the code with expiration (15 minutes)
    resetCodes[email] = {
      code: resetCode,
      expires: Date.now() + 15 * 60 * 1000,
    }

    // Send email with reset code
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Code - PRIME Study Abroad",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">PRIME Study Abroad</h2>
          <p>Hello,</p>
          <p>You requested a password reset. Please use the following code to reset your password:</p>
          <div style="background-color: #f7fafc; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
            ${resetCode}
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Regards,<br>PRIME Study Abroad Team</p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Reset code for ${email}: ${resetCode}`)

    res.status(200).json({ message: "If an account with that email exists, we've sent a password reset code." })
  } catch (err) {
    console.error("Forgot password error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Verify reset code route
router.post("/verify-reset-code", async (req, res) => {
  try {
    const { email, code } = req.body

    // Check if reset code exists and is valid
    if (!resetCodes[email] || resetCodes[email].code !== code) {
      return res.status(400).json({ message: "Invalid or expired code" })
    }

    // Check if code is expired
    if (resetCodes[email].expires < Date.now()) {
      delete resetCodes[email]
      return res.status(400).json({ message: "Code has expired" })
    }

    res.status(200).json({ message: "Code verified successfully" })
  } catch (err) {
    console.error("Verify reset code error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

// Reset password route
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, password } = req.body

    // Check if reset code exists and is valid
    if (!resetCodes[email] || resetCodes[email].code !== code) {
      return res.status(400).json({ message: "Invalid or expired code" })
    }

    // Check if code is expired
    if (resetCodes[email].expires < Date.now()) {
      delete resetCodes[email]
      return res.status(400).json({ message: "Code has expired" })
    }

    // Find user and update password
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Hash the new password
    const hashedPassword = bcrypt.hashSync(password, 10)

    // Update user's password
    user.password = hashedPassword
    await user.save()

    // Remove the reset code
    delete resetCodes[email]

    res.status(200).json({ message: "Password reset successfully" })
  } catch (err) {
    console.error("Reset password error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
