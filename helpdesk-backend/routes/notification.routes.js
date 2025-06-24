import express from "express"
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from "../controllers/notification.controller.js"
import { authenticateJWT } from "../middleware/auth.middleware.js"

const router = express.Router()

// Protect all routes after this middleware
router.use(authenticateJWT)

router.get("/", getNotifications)
router.patch("/read-all", markAllAsRead)
router.patch("/:id/read", markAsRead)
router.delete("/:id", deleteNotification)

export default router
