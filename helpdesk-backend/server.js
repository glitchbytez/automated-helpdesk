import app from "./app.js"
import mongoose from "mongoose"
import {PORT, MONGODB_URI} from "./config/env.js"

let server

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...")
  console.error(err.name, err.message, err.stack)
  process.exit(1)
})

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI)
    console.log("MongoDB connected successfully")

    // Start Express server
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT || 5500}`)
    })

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      console.error("UNHANDLED REJECTION! 💥 Shutting down...")
      console.error(err.name, err.message)
      gracefulShutdown()
    })

    // Handle SIGTERM
    process.on("SIGTERM", () => {
      console.log("👋 SIGTERM RECEIVED. Shutting down gracefully")
      gracefulShutdown()
    })

    // Handle SIGINT
    process.on("SIGINT", () => {
      console.log("👋 SIGINT RECEIVED. Shutting down gracefully")
      gracefulShutdown()
    })

  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

// Graceful shutdown
async function gracefulShutdown() {
  try {
    // Close Express server
    if (server) {
      await new Promise((resolve) => {
        server.close((err) => {
          if (err) {
            console.error("Error closing Express server:", err)
            resolve()
          } else {
            console.log("Express server closed")
            resolve()
          }
        })
      })
    }

    // Close MongoDB connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close()
      console.log("MongoDB connection closed")
    }

    process.exit(0)
  } catch (error) {
    console.error("Error during graceful shutdown:", error)
    process.exit(1)
  }
}

startServer()
