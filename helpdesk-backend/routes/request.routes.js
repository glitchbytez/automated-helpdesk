import express from "express"
import {
    createRequest,
    getAllRequests,
    getRequest,
    updateRequest,
    approveRequest,
    rejectRequest,
    deleteRequest,
    getRequestStats,
} from "../controllers/request.controller.js"
import { authenticateJWT, restrictTo } from "../middleware/auth.middleware.js"

const router = express.Router()

// Public route - anyone can create a request
router.post("/", createRequest)

// Protected routes - require authentication
router.use(authenticateJWT)

// Admin only routes
router.use(restrictTo("admin"))

// Get all requests with filtering and pagination
router.get("/", getAllRequests)

// Get request statistics
router.get("/stats", getRequestStats)

// Get, update, and delete specific requests
router
    .route("/:id")
    .get(getRequest)
    .patch(updateRequest)
    .delete(deleteRequest)

// Approve and reject requests
router.patch("/:id/approve", approveRequest)
router.patch("/:id/reject", rejectRequest)

export default router 