const express = require("express")
const router = express.Router()
const Application = require("../models/Application")
const { authenticateToken } = require("../config/auth")

// Get all applications
router.get("/", authenticateToken, async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("studentId", "name email")
      .sort({ starred: -1, createdAt: -1 }) // Sort by starred first, then by creation date
    res.json(applications)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Get a specific application
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate("studentId", "name email")
    if (!application) {
      return res.status(404).json({ message: "Application not found" })
    }
    res.json(application)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Create a new application
router.post("/", authenticateToken, async (req, res) => {
  const application = new Application({
    studentId: req.body.studentId,
    university: req.body.university,
    program: req.body.program,
    intake: req.body.intake,
    status: req.body.status || "Pending",
    statusColor: req.body.statusColor || "#f3f4f6",
    documents: req.body.documents || [],
    countryCode: req.body.countryCode,
    starred: req.body.starred || false,
    portalName: req.body.portalName || "", // New field for portal name
    potalId: req.body.potalId || "", // New field for total ID
  })

  try {
    const newApplication = await application.save()
    res.status(201).json(newApplication)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Update an application
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
    if (!application) {
      return res.status(404).json({ message: "Application not found" })
    }

    if (req.body.university) application.university = req.body.university
    if (req.body.program) application.program = req.body.program
    if (req.body.intake) application.intake = req.body.intake
    if (req.body.applicationFee) application.applicationFee = req.body.applicationFee
    if (req.body.status) application.status = req.body.status
    if (req.body.statusColor) application.statusColor = req.body.statusColor
    if (req.body.documents) application.documents = req.body.documents
    if (req.body.countryCode) application.countryCode = req.body.countryCode
    if (req.body.starred !== undefined) application.starred = req.body.starred
    if (req.body.portalName !== undefined) application.portalName = req.body.portalName
    if (req.body.potalId !== undefined) application.potalId = req.body.potalId

    application.updatedAt = Date.now()

    const updatedApplication = await application.save()
    res.json(updatedApplication)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Toggle starred status
router.patch("/:id/toggle-star", authenticateToken, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
    if (!application) {
      return res.status(404).json({ message: "Application not found" })
    }

    application.starred = !application.starred
    application.updatedAt = Date.now()

    const updatedApplication = await application.save()
    res.json(updatedApplication)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// Delete an application
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
    if (!application) {
      return res.status(404).json({ message: "Application not found" })
    }
    await Application.findByIdAndDelete(req.params.id)
    res.json({ message: "Application deleted" })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
