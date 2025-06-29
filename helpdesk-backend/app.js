import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import morgan from "morgan"
import helmet from "helmet"
import compression from "compression"

import { CORS_ORIGIN, NODE_ENV } from "./config/env.js"

// Routes
import authRouter from "./routes/auth.routes.js"
import userRouter from "./routes/user.routes.js"
import ticketRouter from "./routes/ticket.routes.js"
import chatRouter from "./routes/chat.routes.js"
import reportRouter from "./routes/report.routes.js"
import notificationRouter from "./routes/notification.routes.js"
import publicRouter from "./routes/public.routes.js"
import requestRouter from "./routes/request.routes.js"

// Middleware
import { authenticateJWT } from "./middleware/auth.middleware.js"
import errorHandler from "./middleware/error.middleware.js"


// Initialize express app
const app = express()

// allowed origins
const allowedOrigins = [
  "http://localhost:3000",   // chatbot frontend (local)
  "http://localhost:3001",   // helpdesk frontend (local)
  "http://localhost:3002",   // additional frontend (local)
  "http://localhost:5005",   // rasa server (local)
  "http://chatbot-frontend:3000",  // chatbot frontend (docker)
  "http://helpdesk-frontend:3000", // helpdesk frontend (docker)
  "http://rasa-backend:5005",      // rasa server (docker)
]

// Security middleware
app.use(helmet())
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
app.use(cookieParser())

// Compression middleware
app.use(compression())

// Logging middleware
if (NODE_ENV === "development") {
  app.use(morgan("dev"))
}


// Routes
// Public routes first (no authentication required)
app.use("/api/v1", publicRouter)

// Authentication routes
app.use("/api/v1/auth", authRouter)

// Protected routes
app.use("/api/v1/users", authenticateJWT, userRouter)
app.use("/api/v1/tickets", authenticateJWT, ticketRouter)
app.use("/api/v1/chats", authenticateJWT, chatRouter)
app.use("/api/v1/reports", authenticateJWT, reportRouter)
app.use("/api/v1/notifications", authenticateJWT, notificationRouter)
app.use("/api/v1/requests", requestRouter)

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const healthCheck = {
      status: "ok",
      message: "Server is running",
      environment: NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
        external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100
      },
      database: "disconnected"
    }

    // Check database connection
    const mongoose = await import("mongoose")
    if (mongoose.default.connection.readyState === 1) {
      healthCheck.database = "connected"
    } else if (mongoose.default.connection.readyState === 2) {
      healthCheck.database = "connecting"
    } else if (mongoose.default.connection.readyState === 3) {
      healthCheck.database = "disconnecting"
    }

    // If database is not connected, return 503 status
    if (healthCheck.database === "disconnected") {
      return res.status(503).json({
        ...healthCheck,
        status: "error",
        message: "Database not connected"
      })
    }

    res.status(200).json(healthCheck)
  } catch (error) {
    res.status(503).json({
      status: "error",
      message: "Health check failed",
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Simple liveness probe endpoint (for load balancers)
app.get("/ping", (req, res) => {
  res.status(200).json({ 
    status: "ok",
    timestamp: new Date().toISOString()
  })
})

// Handle 404 routes
app.use("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: `Cannot ${req.method} ${req.originalUrl}`
  })
})

// Error handling middleware
app.use(errorHandler)

export default app
