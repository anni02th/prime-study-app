const express = require("express")
const router = express.Router()
const Student = require("../models/Student")
const User = require("../models/User")
const Application = require("../models/Application")
const Document = require("../models/Document")
const { authenticateToken, isAdminOrAdvisor } = require("../config/auth")
const upload = require("../config/upload")
const fs = require("fs")
const path = require("path")
const mongoose = require("mongoose")

// Update the route to get all students (admin/advisor only)
// This will filter students based on the advisor's ID if the user is an advisor
router.get("/", authenticateToken, isAdminOrAdvisor, async (req, res) => {
  try {
    let query = {}

    // If the user is an advisor, only show students assigned to them
    if (req.user.role === "advisor") {
      query = { advisors: req.user.id }
    }

    // Populate both advisor and advisors fields for backward compatibility
    const students = await Student.find(query)
      .populate("advisors", "name email avatar")
      .populate("advisorId", "name email avatar")
      .populate("userId", "avatar")
      .sort({ createdAt: -1 })

    res.json(students)
  } catch (err) {
    console.error("Error fetching students:", err)
    res.status(500).json({ message: err.message })
  }
})

// IMPORTANT: This route must be defined BEFORE the /:id route to avoid "profile" being treated as an ID
// Update the route to get student profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    console.log("Fetching profile for user ID:", req.user.id)

    const student = await Student.findOne({ userId: req.user.id })
      .populate("userId", "avatar")
      .populate("advisors", "name email avatar")
      .populate("advisorId", "name email avatar")
      .populate("createdBy", "name email avatar")

    if (!student) {
      console.log("No student profile found for user ID:", req.user.id)

      // Check if the user exists
      const user = await User.findById(req.user.id)
      if (!user) {
        console.log("User not found:", req.user.id)
        return res.status(404).json({ message: "User not found" })
      }

      // If user exists but no student profile, create a basic one
      if (user.role === "student") {
        console.log("Creating new student profile for user:", user.name)
        const newStudent = new Student({
          name: user.name,
          email: user.email,
          userId: user._id,
          // Set default values for required fields
          degree: "Not specified",
          major: "Not specified",
          gpa: "Not specified",
        })

        const savedStudent = await newStudent.save()

        // Update user with studentId reference
        await User.findByIdAndUpdate(user._id, { studentId: savedStudent._id })

        const populatedStudent = await Student.findById(savedStudent._id)
          .populate("userId", "avatar")
          .populate("advisors", "name email avatar")
          .populate("advisorId", "name email avatar")
          .populate("createdBy", "name email avatar")

        return res.json({
          ...populatedStudent.toObject(),
          avatar: user.avatar,
          advisors: populatedStudent.advisors || [],
          createdBy: populatedStudent.createdBy
            ? {
                _id: populatedStudent.createdBy._id,
                name: populatedStudent.createdBy.name,
                email: populatedStudent.createdBy.email,
                avatar: populatedStudent.createdBy.avatar,
              }
            : null,
        })
      }

      return res.status(404).json({ message: "Student profile not found" })
    }

    // Update user with studentId reference if not already set
    const user = await User.findById(req.user.id)
    if (user && !user.studentId) {
      await User.findByIdAndUpdate(user._id, { studentId: student._id })
    }

    res.json({
      ...student.toObject(),
      avatar: student.userId ? student.userId.avatar : null,
      advisors: student.advisors || [],
      createdBy: student.createdBy
        ? {
            _id: student.createdBy._id,
            name: student.createdBy.name,
            email: student.createdBy.email,
            avatar: student.createdBy.avatar,
          }
        : null,
    })
  } catch (err) {
    console.error("Error fetching student profile:", err)
    res.status(500).json({ message: err.message })
  }
})

// Update the route to get student by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    // Populate advisors field
    const student = await Student.findById(req.params.id)
      .populate("advisors", "name email avatar")
      .populate("advisorId", "name email avatar")
      .populate("userId", "avatar")

    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    res.json(student)
  } catch (err) {
    console.error("Error fetching student:", err)
    res.status(500).json({ message: err.message })
  }
})

// Create a new student (admin/advisor only)
router.post("/", authenticateToken, isAdminOrAdvisor, async (req, res) => {
  try {
    const { email } = req.body

    // Check if student with this email already exists
    const existingStudent = await Student.findOne({ email })
    if (existingStudent) {
      return res.status(400).json({ message: "Student with this email already exists" })
    }

    // Create new student
    const student = new Student(req.body)

    // If advisors array is provided, use it
    if (req.body.advisors && Array.isArray(req.body.advisors)) {
      student.advisors = req.body.advisors
      // Also set the first advisor as the primary advisor for backward compatibility
      if (req.body.advisors.length > 0) {
        student.advisorId = req.body.advisors[0]
      }
    }
    // If only a single advisor is provided, add it to the advisors array
    else if (req.body.advisorId) {
      student.advisorId = req.body.advisorId
      student.advisors = [req.body.advisorId]
    }

    const newStudent = await student.save()

    // Populate advisors information - REMOVED the advisor population that was causing the error
    await newStudent.populate("advisors", "name email avatar")
    // Also populate advisorId for backward compatibility
    await newStudent.populate("advisorId", "name email avatar")

    res.status(201).json(newStudent)
  } catch (err) {
    console.error("Error creating student:", err)
    res.status(400).json({ message: err.message })
  }
})

// Update student by ID
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    // Check if user is admin/advisor or the student themself
    const isAuthorized =
      req.user.role === "admin" ||
      req.user.role === "advisor" ||
      (student.userId && student.userId.toString() === req.user.id)

    if (!isAuthorized) {
      return res.status(403).json({ message: "Not authorized to update this student" })
    }

    // // Handle specific fields update (to avoid unnecessary population)
    // if (req.body.updateFields && Array.isArray(req.body.updateFields)) {
    //   // Only update the specified fields
    //   req.body.updateFields.forEach((field) => {
    //     if (req.body[field] !== undefined) {
    //       student[field] = req.body[field]
    //     }
    //   })

    //   student.updatedAt = Date.now()
    //   const updatedStudent = await student.save()

    //   res.json({
    //     message: "Fields updated successfully",
    //     student: {
    //       _id: updatedStudent._id,
    //       ...req.body.updateFields.reduce((obj, field) => {
    //         obj[field] = updatedStudent[field]
    //         return obj
    //       }, {}),
    //     },
    //   })
    //   return
    // }

    // Traditional update (with population)
    // Handle advisors update
    if (req.body.advisors && Array.isArray(req.body.advisors)) {
      student.advisors = req.body.advisors
      // Also update the primary advisor for backward compatibility
      if (req.body.advisors.length > 0) {
        student.advisorId = req.body.advisors[0]
      } else {
        student.advisorId = null
      }
    }
    // If only updating the primary advisor
    else if (req.body.advisorId) {
      student.advisorId = req.body.advisorId

      // Add to advisors array if not already there
      if (!student.advisors) {
        student.advisors = [req.body.advisorId]
      } else if (!student.advisors.includes(req.body.advisorId)) {
        student.advisors.push(req.body.advisorId)
      }
    }

    // Update other fields
    const fieldsToUpdate = [
      "name",
      "email",
      "contact",
      "degree",
      "major",
      "gpa",
      "dateOfBirth",
      "gender",
      "nationality",
      "passportNumber",
      "passportIssueDate",
      "passportExpiryDate",
      "passportIssueCountry",
      "cityOfBirth",
      "countryOfBirth",
      "maritalStatus",
      "address1",
      "address2",
      "citizenship",
      "multipleCitizenship",
      "studyingInOtherCountry",
      "appliedForImmigration",
      "medicalCondition",
      "isUSPermanentResident",
      "isCanadianPermanentResident",
      "emergencyContact",
      "educationSummary",
      "postGraduate",
      "underGraduate",
      "grade12",
      "grade10",
      "workExperience",
      "testScores",
    ]

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        student[field] = req.body[field]
      }
    })

    // Mark as edited if the student is updating their own profile
    if (student.userId && student.userId.toString() === req.user.id) {
      student.hasEditedProfile = true
    }

    student.updatedAt = Date.now()
    const updatedStudent = await student.save()

    // Populate advisor and advisors information
    await updatedStudent.populate("advisors", "name email avatar")
    // Also populate advisorId for backward compatibility
    await updatedStudent.populate("advisorId", "name email avatar")
    await updatedStudent.populate("userId", "avatar")

    res.json(updatedStudent)
  } catch (err) {
    console.error("Error updating student:", err)
    res.status(400).json({ message: err.message })
  }
})

// Add or remove an advisor to a student
router.patch("/:id/advisors", authenticateToken, isAdminOrAdvisor, async (req, res) => {
  try {
    const { action, advisorId } = req.body

    if (!action || !advisorId) {
      return res.status(400).json({ message: "Action and advisorId are required" })
    }

    if (action !== "add" && action !== "remove") {
      return res.status(400).json({ message: "Action must be 'add' or 'remove'" })
    }

    const student = await Student.findById(req.params.id)
    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    // Initialize advisors array if it doesn't exist
    if (!student.advisors) {
      student.advisors = []
    }

    if (action === "add") {
      // Check if advisor exists
      const advisor = await User.findById(advisorId)
      if (!advisor || advisor.role !== "advisor") {
        return res.status(404).json({ message: "Advisor not found" })
      }

      // Add advisor if not already in the list
      if (!student.advisors.includes(advisorId)) {
        student.advisors.push(advisorId)

        // If this is the first advisor, also set as primary advisor
        if (student.advisors.length === 1) {
          student.advisorId = advisorId
        }
      }
    } else if (action === "remove") {
      // Remove advisor from the list
      student.advisors = student.advisors.filter((id) => id.toString() !== advisorId)

      // If removing the primary advisor, update it to the first available advisor
      if (student.advisorId && student.advisorId.toString() === advisorId) {
        student.advisorId = student.advisors.length > 0 ? student.advisors[0] : null
      }
    }

    student.updatedAt = Date.now()
    const updatedStudent = await student.save()

    // Populate advisor and advisors information
    await updatedStudent.populate("advisors", "name email avatar")
    // Also populate advisorId for backward compatibility
    await updatedStudent.populate("advisorId", "name email avatar")

    res.json(updatedStudent)
  } catch (err) {
    console.error("Error updating student advisors:", err)
    res.status(400).json({ message: err.message })
  }
})

// Add the route to update advisor notes
router.patch("/:id/advisor-notes", authenticateToken, isAdminOrAdvisor, async (req, res) => {
  try {
    const { notes } = req.body
    if (notes === undefined) {
      return res.status(400).json({ message: "Notes are required" })
    }

    const student = await Student.findById(req.params.id)
    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    student.advisorNotes = notes
    student.updatedAt = Date.now()
    const updatedStudent = await student.save()

    res.json({ message: "Advisor notes updated successfully", notes: updatedStudent.advisorNotes })
  } catch (err) {
    console.error("Error updating advisor notes:", err)
    res.status(400).json({ message: err.message })
  }
})

// Delete student by ID (admin only)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    // Only admin can delete students
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete students" })
    }

    const student = await Student.findById(req.params.id)
    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    // Delete associated applications
    await Application.deleteMany({ studentId: req.params.id })

    // Delete associated documents
    const documents = await Document.find({ studentId: req.params.id })
    for (const doc of documents) {
      // Delete file if it exists
      if (doc.filePath) {
        const fullPath = path.join(__dirname, "..", "..", doc.filePath)
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath)
        }
      }
    }
    await Document.deleteMany({ studentId: req.params.id })

    // Delete the student
    await Student.findByIdAndDelete(req.params.id)

    res.json({ message: "Student deleted successfully" })
  } catch (err) {
    console.error("Error deleting student:", err)
    res.status(500).json({ message: err.message })
  }
})

// Get student applications
router.get("/:id/applications", authenticateToken, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    // Check if user is admin/advisor or the student's user
    const isAuthorized =
      req.user.role === "admin" ||
      req.user.role === "advisor" ||
      (student.userId && student.userId.toString() === req.user.id)

    if (!isAuthorized) {
      return res.status(403).json({ message: "Not authorized to view this student's applications" })
    }

    const applications = await Application.find({ studentId: req.params.id }).sort({ createdAt: -1 })
    res.json(applications)
  } catch (err) {
    console.error("Error fetching student applications:", err)
    res.status(500).json({ message: err.message })
  }
})

// Get student documents
router.get("/:id/documents", authenticateToken, async (req, res) => {
  try {
    // Validate if id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid student ID format" })
    }

    const documents = await Document.find({ studentId: req.params.id }).sort({ createdAt: -1 })
    res.json(documents)
  } catch (err) {
    console.error("Error fetching student documents:", err)
    res.status(500).json({ message: err.message })
  }
})

// Upload student profile picture
router.post("/:id/avatar", authenticateToken, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const student = await Student.findById(req.params.id)
    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    // Check if user is admin/advisor or the student's user
    const isAuthorized =
      req.user.role === "admin" ||
      req.user.role === "advisor" ||
      (student.userId && student.userId.toString() === req.user.id)

    if (!isAuthorized) {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path)
      return res.status(403).json({ message: "Not authorized to update this student's avatar" })
    }

    // If student has a user account, update the user's avatar
    if (student.userId) {
      const user = await User.findById(student.userId)
      if (user) {
        // Delete old avatar if it exists
        if (user.avatar && user.avatar.startsWith("/uploads/")) {
          const oldAvatarPath = path.join(__dirname, "..", "..", user.avatar)
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath)
          }
        }

        // Update user avatar
        user.avatar = `/${req.file.path.replace(/\\/g, "/")}`
        await user.save()
      }
    }

    res.json({
      message: "Avatar uploaded successfully",
      avatar: `/${req.file.path.replace(/\\/g, "/")}`,
    })
  } catch (err) {
    console.error("Error uploading avatar:", err)
    // Delete the uploaded file if there was an error
    if (req.file) {
      fs.unlinkSync(req.file.path)
    }
    res.status(500).json({ message: err.message })
  }
})

// Update avatar path only (for avatars not uploaded via file)
router.put("/:id/avatar", authenticateToken, async (req, res) => {
  try {
    const { avatar } = req.body

    if (!avatar) {
      return res.status(400).json({ message: "Avatar URL is required" })
    }

    const student = await Student.findById(req.params.id)

    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    // Update student avatar
    student.avatar = avatar
    await student.save()

    // If the student has a userId, update the user's avatar as well
    if (student.userId) {
      const user = await User.findById(student.userId)
      if (user) {
        user.avatar = avatar
        await user.save()
      }
    }

    res.json({ message: "Avatar updated successfully", avatar })
  } catch (err) {
    console.error("Error updating student avatar:", err)
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
