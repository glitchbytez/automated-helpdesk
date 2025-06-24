import {Router} from "express"
import * as chatController from "../controllers/chat.controller.js"
import { authenticateJWT } from "../middleware/auth.middleware.js"

const chatRouter = Router()

// Protect all routes
chatRouter.use(authenticateJWT)

// Get all chats for current agent
chatRouter.get("/", chatController.getMyChats)

// Create a new chat
chatRouter.post("/", chatController.createChat)

// Get, update, close specific chat
chatRouter.route("/:id").get(chatController.getChat).patch(chatController.updateChat).delete(chatController.closeChat)

// Get chat by ticket ID
chatRouter.get("/ticket/:ticketId", chatController.getChatByTicketId)

// Add message to chat
chatRouter.post("/:id/messages", chatController.addMessage)

// Mark messages as read
chatRouter.patch("/:id/read", chatController.markAsRead)

export default chatRouter
