const mongoose = require("mongoose")

const studentSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true },
  email: { type: String, required: true },

  // Personal Information
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ["Male", "Female", "Other", "Prefer not to say"] },
  maritalStatus: { type: String, enum: ["Single", "Married", "Divorced", "Widowed"] },

  // Mailing Address
  address: { type: String },

  // Passport Information
  passportNumber: { type: String },
  passportIssueDate: { type: Date },
  passportExpiryDate: { type: Date },
  passportIssueCountry: { type: String },
  cityOfBirth: { type: String },
  countryOfBirth: { type: String },

  // Nationality
  nationality: { type: String },
  citizenship: { type: String },
  multipleCitizenship: { type: Boolean, default: false },
  studyingInOtherCountry: { type: Boolean, default: false },

  // Background Info
  appliedForImmigration: { type: Boolean, default: false },
  medicalCondition: { type: Boolean, default: false },

  // Emergency Contact
  emergencyContact: {
    name: { type: String },
    phone: { type: String },
    email: { type: String },
    relation: { type: String },
  },

  // Additional Information
  isUSPermanentResident: { type: Boolean, default: false },
  isCanadianPermanentResident: { type: Boolean, default: false },

  // Academic Qualification
  educationSummary: {
    countryOfEducation: { type: String },
    highestLevelOfEducation: { type: String },
  },

  // Post Graduate
  postGraduate: {
    countryOfStudy: { type: String },
    stateOfStudy: { type: String },
    universityName: { type: String },
    qualification: { type: String },
    cityOfStudy: { type: String },
    gradingSystem: { type: String },
    percentage: { type: String },
    primaryLanguage: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
  },

  // Under Graduate
  degree: { type: String },
  major: { type: String },
  gpa: { type: String },
  underGraduate: {
    countryOfStudy: { type: String },
    stateOfStudy: { type: String },
    universityName: { type: String },
    qualification: { type: String },
    cityOfStudy: { type: String },
    gradingSystem: { type: String },
    percentage: { type: String },
    primaryLanguage: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
  },

  // Grade 12th
  grade12: {
    countryOfStudy: { type: String },
    stateOfStudy: { type: String },
    schoolName: { type: String },
    qualification: { type: String },
    cityOfStudy: { type: String },
    gradingSystem: { type: String },
    percentage: { type: String },
    primaryLanguage: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
  },

  // Grade 10th
  grade10: {
    countryOfStudy: { type: String },
    stateOfStudy: { type: String },
    schoolName: { type: String },
    qualification: { type: String },
    cityOfStudy: { type: String },
    gradingSystem: { type: String },
    percentage: { type: String },
    primaryLanguage: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
  },

  // Work Experience
  workExperience: {
    organizationName: { type: String },
    organizationAddress: { type: String },
    position: { type: String },
    jobProfile: { type: String },
    salaryMode: { type: String },
    workingFrom: { type: Date },
    workingUpto: { type: Date },
  },

  // Test Scores
  testScores: {
    gre: {
      overallScore: { type: String },
      examDate: { type: Date },
      verbal: { type: String },
      quantitative: { type: String },
      analytical: { type: String },
    },
    gmat: {
      overallScore: { type: String },
      examDate: { type: Date },
      verbal: { type: String },
      quantitative: { type: String },
      analytical: { type: String },
    },
    toefl: {
      overallScore: { type: String },
      examDate: { type: Date },
      listening: { type: String },
      reading: { type: String },
      writing: { type: String },
      speaking: { type: String },
    },
    ielts: {
      overallScore: { type: String },
      trfNumber: { type: String },
      examDate: { type: Date },
      listening: { type: String },
      reading: { type: String },
      writing: { type: String },
      speaking: { type: String },
      yetToReceive: { type: Boolean, default: false },
      testResultDate: { type: Date },
      ieltsWaiver: { type: Boolean, default: false },
    },
    pte: {
      overallScore: { type: String },
      examDate: { type: Date },
    },
    det: {
      overallScore: { type: String },
      examDate: { type: Date },
    },
    sat: {
      overallScore: { type: String },
      examDate: { type: Date },
    },
    act: {
      overallScore: { type: String },
      examDate: { type: Date },
    },
    englishMarks12th: { type: String },
    mediumOfInstruction: { type: String },
  },

  // Contact Information
  contact: { type: String },

  // Advisor Notes (only visible to advisors/admins)
  advisorNotes: { type: String, default: "" },

  // System Fields
  advisorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  // Add advisors array to support multiple advisors
  advisors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  hasEditedProfile: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  // Track who created this student record
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
})

module.exports = mongoose.model("Student", studentSchema)
