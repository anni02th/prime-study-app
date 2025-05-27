const express = require("express")
const router = express.Router()
const User = require("../models/User")
const Student = require("../models/Student")
const { authenticateToken } = require("../config/auth")
const upload = require("../config/upload")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")

// Helper function to generate a unique filename
const generateUniqueFilename = (originalname) => {
  const timestamp = Date.now()
  const randomString = crypto.randomBytes(8).toString("hex")
  const extension = path.extname(originalname)
  return `avatar-${timestamp}-${randomString}${extension}`
}

// Upload avatar
router.post("/upload", authenticateToken, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    // Generate a unique filename
    const uniqueFilename = generateUniqueFilename(req.file.originalname)

    // Create the uploads/avatars directory if it doesn't exist
    const avatarDir = path.join(__dirname, "../../uploads/avatars")
    if (!fs.existsSync(avatarDir)) {
      fs.mkdirSync(avatarDir, { recursive: true })
    }

    // Define the new path with the unique filename
    const newPath = path.join(avatarDir, uniqueFilename)

    // If using local storage, rename the file
    if (req.file.path && !req.file.location) {
      // Create a read stream from the uploaded file
      const readStream = fs.createReadStream(req.file.path)
      // Create a write stream to the new path
      const writeStream = fs.createWriteStream(newPath)

      // Pipe the read stream to the write stream
      readStream.pipe(writeStream)

      // When the write is complete, delete the original file
      writeStream.on("finish", () => {
        fs.unlinkSync(req.file.path)
      })
    }

    // Construct the avatar URL
    const avatarUrl = `/uploads/avatars/${uniqueFilename}`

    // Update the user's avatar if userId is provided
    if (req.body.userId) {
      const user = await User.findById(req.body.userId)
      if (user) {
        // Delete old avatar if it exists and is a local file
        if (user.avatar && user.avatar.startsWith("/uploads/") && !user.avatar.startsWith("http")) {
          const oldAvatarPath = path.join(__dirname, "../..", user.avatar)
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath)
          }
        }

        user.avatar = avatarUrl
        await user.save()

        // If this is a student, update the student's user reference
        if (user.role === "student") {
          const student = await Student.findOne({ userId: user._id })
          if (student) {
            await student.save()
          }
        }
      }
    }

    // Update the student's avatar if studentId is provided
    if (req.body.studentId) {
      const student = await Student.findById(req.body.studentId)
      if (student) {
        // Delete old avatar if it exists and is a local file
        if (student.avatar && student.avatar.startsWith("/uploads/") && !student.avatar.startsWith("http")) {
          const oldAvatarPath = path.join(__dirname, "../..", student.avatar)
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath)
          }
        }

        student.avatar = avatarUrl
        await student.save()

        // If the student has a userId, update the user's avatar as well
        if (student.userId) {
          const user = await User.findById(student.userId)
          if (user) {
            // Delete old avatar if it exists and is a local file
            if (user.avatar && user.avatar.startsWith("/uploads/") && !user.avatar.startsWith("http")) {
              const oldAvatarPath = path.join(__dirname, "../..", user.avatar)
              if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath)
              }
            }

            user.avatar = avatarUrl
            await user.save()
          }
        }
      }
    }

    res.json({
      message: "Avatar uploaded successfully",
      avatar: avatarUrl,
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

// Get available avatars
router.get("/available", async (req, res) => {
  try {
    // Define the path to the default avatars directory
    const avatarsDir = path.join(__dirname, "../../public/avatars")

    // Read the directory to get all avatar files
    const files = fs.readdirSync(avatarsDir)

    // Filter for image files
    const avatars = files.filter((file) => /\.(jpg|jpeg|png|gif|svg)$/i.test(file)).map((file) => `/avatars/${file}`)

    res.json(avatars)
  } catch (err) {
    console.error("Error getting available avatars:", err)
    res.status(500).json({ message: err.message })
  }
})

// Get user avatar
router.get("/:userId", async (req, res) => {
  try {
    const userId = req.params.userId
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ avatar: user.avatar })
  } catch (err) {
    console.error("Error getting user avatar:", err)
    res.status(500).json({ message: err.message })
  }
})

// Get student avatar
router.get("/student/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId
    const student = await Student.findById(studentId)

    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    res.json({ avatar: student.avatar })
  } catch (err) {
    console.error("Error getting student avatar:", err)
    res.status(500).json({ message: err.message })
  }
})

// Check if avatar directory exists
router.get("/check-directory", async (req, res) => {
  try {
    const avatarDir = path.join(__dirname, "../../uploads/avatars")
    const exists = fs.existsSync(avatarDir)

    res.json({
      exists,
      path: avatarDir,
      absolutePath: path.resolve(avatarDir),
    })
  } catch (err) {
    console.error("Error checking avatar directory:", err)
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
