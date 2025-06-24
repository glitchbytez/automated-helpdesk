import { Router } from "express"

// We'll need to create these controllers
import * as sessionController from "../controllers/session.controller.js"
import * as messageController from "../controllers/message.controller.js"
import * as feedbackController from "../controllers/feedback.controller.js"
import * as ticketController from "../controllers/ticket.controller.js"

const publicRouter = Router()

// Session endpoints (public access for chatbot server)
publicRouter.get("/sessions/public", sessionController.getAllSessions)
publicRouter.get("/sessions/active/public", sessionController.getActiveSessions)
publicRouter.get("/sessions/:sessionId/public", sessionController.getSession)
publicRouter.post("/sessions/public", sessionController.createSession)
publicRouter.patch("/sessions/:sessionId/public", sessionController.updateSession)
publicRouter.patch("/sessions/:sessionId/end/public", sessionController.endConversation)

// Message endpoints (public access for chatbot server)
publicRouter.get("/messages/public", messageController.getAllMessages)
publicRouter.get("/messages/latest/public", messageController.getLatestMessages)
publicRouter.get("/sessions/:sessionId/messages/public", messageController.getSessionMessages)
publicRouter.post("/messages/public", messageController.createMessage)

// Ticket endpoints (public access)
publicRouter.get("/tickets/:ticketId/status", ticketController.getTicketStatus)
publicRouter.post("/tickets/public", ticketController.createTicketInternal)

// Feedback endpoints (public access for chatbot server)
publicRouter.post("/feedback/public", feedbackController.submitFeedback)
publicRouter.get("/feedback/public", feedbackController.getAllFeedback)
publicRouter.get("/feedback/stats/public", feedbackController.getFeedbackStats)
publicRouter.get("/feedback/:id/public", feedbackController.getFeedbackById)
publicRouter.get("/sessions/:sessionId/feedback/public", feedbackController.getFeedbackBySessionId)

export default publicRouter
