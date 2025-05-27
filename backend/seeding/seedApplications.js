const mongoose = require("mongoose");
const Student = require("../models/Student");
const Application = require("../models/Application");

const connectDB = async () => {
  await mongoose.connect("mongodb+srv://aniketmore2000th:Aniket02th@cluster0.qovnopj.mongodb.net/");
};

const seedData = async () => {
  const students = [
    {
      name: "Alex Carter",
      degree: "B.Tech",
      major: "Computer Science",
      gpa: "8.9",
      avatar: "/placeholder.png?height=80&width=80",
      email: "alex.carter@example.com", // ✅ required
      applications: [
        { applicationId: "101", university: "Delft University", countryCode: "NL", program: "Masters" },
        { applicationId: "102", university: "École Polytechnique", countryCode: "FR", program: "Masters" },
        { applicationId: "103", university: "McGill University", countryCode: "CA", program: "Masters" },
      ],
    },
    {
      name: "Max Calloway",
      degree: "B.E",
      major: "Mechanical Engineering",
      gpa: "7.8",
      avatar: "/placeholder.png?height=80&width=80",
      email: "max.calloway@example.com", // ✅ unique email
      applications: [
        { applicationId: "104", university: "KTH Royal Institute", countryCode: "SE", program: "Masters" },
        { applicationId: "105", university: "University of Munich", countryCode: "DE", program: "Masters" },
        { applicationId: "106", university: "Purdue University", countryCode: "US", program: "Masters" },
      ],
    },
  ];

  for (const student of students) {
    const newStudent = new Student({
      name: student.name,
      degree: student.degree,
      major: student.major,
      gpa: student.gpa,
      avatar: student.avatar,
      email: student.email, // ✅ move this here
    });

    const savedStudent = await newStudent.save();

    for (const app of student.applications) {
      const application = new Application({
        studentId: savedStudent._id,
        applicationId: app.applicationId,
        program: app.program,
        university: app.university,
        status: "Pending",
        details: {
          countryCode: app.countryCode,
        },
      });

      await application.save();
    }
  }

  console.log("Seeding done!");
};

connectDB().then(seedData);
