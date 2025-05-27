const jwt = require("jsonwebtoken")
const User = require("../models/User")
const Student = require("../models/Student")

// Middleware to authenticate token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Get the user from database to ensure they exist and get latest data
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(401).json({ message: "Invalid token. User not found." })
    }

    // If user is a student, find their student profile and attach studentId
    if (user.role === "student") {
      const student = await Student.findOne({ userId: user._id })
      if (student) {
        user.studentId = student._id.toString()
      }
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      studentId: user.studentId || (user.role === "student" ? user._id.toString() : null),
    }

    next()
  } catch (err) {
    console.error("Authentication error:", err)
    return res.status(403).json({ message: "Invalid token" })
  }
}

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin role required." })
  }
  next()
}

// Middleware to check if user is advisor
const isAdvisor = (req, res, next) => {
  if (req.user.role !== "advisor") {
    return res.status(403).json({ message: "Access denied. Advisor role required." })
  }
  next()
}

// Middleware to check if user is admin or advisor
const isAdminOrAdvisor = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "advisor") {
    return res.status(403).json({ message: "Access denied. Admin or advisor role required." })
  }
  next()
}

// Middleware to check if user is a student
const isStudent = (req, res, next) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ message: "Access denied. Student role required." })
  }
  next()
}

module.exports = {
  authenticateToken,
  isAdmin,
  isAdvisor,
  isAdminOrAdvisor,
  isStudent,
}
