const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const path = require("path")
const dotenv = require("dotenv")
const fs = require("fs")

// Load environment variables
dotenv.config()

// Create Express app
const app = express()

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL, // Allow any origin if not specified
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
}
// app.use(cors())
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Create uploads directory if it doesn't exist
const uploadsDir = process.env.UPLOAD_PATH || "uploads"
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Create avatars directory if it doesn't exist
const avatarsDir = path.join(uploadsDir, "avatars")
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true })
  console.log(`Created avatars directory at ${avatarsDir}`)
}

// Ensure the uploads directory is properly served
app.use("/uploads", express.static(path.join(__dirname, "..", uploadsDir)))

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "..", uploadsDir)))

// Log all requests to debug file serving issues
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/prime_study_abroad")
    console.log("MongoDB connected successfully")
  } catch (err) {
    console.error("MongoDB connection error:", err.message)
    // Retry connection after delay
    setTimeout(connectDB, 5000)
  }
}

connectDB()

// Import routes
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/user")
const studentRoutes = require("./routes/student")
const applicationRoutes = require("./routes/application")
const documentRoutes = require("./routes/document")
const chatRoutes = require("./routes/chat")
const applicationChatRoutes = require("./routes/applicationChat")
const avatarRoutes = require("./routes/avatar")

// Use routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/students", studentRoutes)
app.use("/api/applications", applicationRoutes)
app.use("/api/documents", documentRoutes)
app.use("/api/chats", chatRoutes)
app.use("/api/application-chats", applicationChatRoutes)
app.use("/api/avatars", avatarRoutes)

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" })
})

// Debug route to check file existence
app.get("/check-file", (req, res) => {
  const filePath = req.query.path
  if (!filePath) {
    return res.status(400).json({ message: "No file path provided" })
  }

  const fullPath = path.join(__dirname, "..", filePath)
  const exists = fs.existsSync(fullPath)

  res.json({
    requestedPath: filePath,
    fullPath: fullPath,
    exists: exists,
    uploadsDir: uploadsDir,
    staticPath: path.join(__dirname, "..", uploadsDir),
  })
})

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` })
})

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err)
  res.status(500).json({ message: err.message || "Something went wrong on the server" })
})

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err)
})

module.exports = app
