const mongoose = require("mongoose")
require("dotenv").config()

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI

    if (!mongoURI) {
      console.error("MONGODB_URI environment variable is not set")
      process.exit(1)
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log("Connected to MongoDB")

    // Add connection error handler
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err)
    })

    // Add disconnection handler
    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting to reconnect...")
    })
  } catch (err) {
    console.error("MongoDB connection error:", err)
    process.exit(1)
  }
}

module.exports = connectDB
