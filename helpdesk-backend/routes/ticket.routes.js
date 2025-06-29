import { Router } from "express"
import * as ticketController from "../controllers/ticket.controller.js"
import { authenticateJWT, checkPermission } from "../middleware/auth.middleware.js"
import { authenticateApiKey } from "../middleware/apikey.middleware.js"

const ticketRouter = Router()

// Apply API key authentication first
ticketRouter.use(authenticateApiKey)

// Then apply JWT authentication (will be skipped if API key auth was successful)
ticketRouter.use(authenticateJWT)

// Get all tickets (with permission check)
ticketRouter.get("/", checkPermission("viewTickets"), ticketController.getAllTickets)

// Get my assigned tickets
ticketRouter.get("/my-tickets", ticketController.getMyTickets)

// Get unassigned tickets
ticketRouter.get("/unassigned", ticketController.getUnassignedTickets)

// Get ticket statistics
ticketRouter.get("/stats", ticketController.getTicketStats)

// Delete all tickets (admin operation) - MUST come before /:id route
ticketRouter.delete("/all", checkPermission("deleteTickets"), ticketController.deleteAllTickets)

// Create a new ticket
ticketRouter.post("/", checkPermission("createTickets"), ticketController.createTicket)

// Get, update, delete specific ticket
ticketRouter
    .route("/:id")
    .get(checkPermission("viewTickets"), ticketController.getTicket)
    .patch(ticketController.updateTicket)
    .delete(checkPermission("deleteTickets"), ticketController.deleteTicket)

// Assign ticket
ticketRouter.patch("/:id/assign", checkPermission("assignTickets"), ticketController.assignTicket)

// Assign ticket to self
ticketRouter.patch("/:id/assign-to-self", ticketController.assignToSelf)

// Add message to ticket
ticketRouter.post("/:id/messages", ticketController.addMessage)

// Get ticket messages (email conversation)
ticketRouter.get("/:id/messages", ticketController.getTicketMessages)

// Send email message for ticket
ticketRouter.post("/:id/email", ticketController.sendTicketEmail)

// Add note to ticket
ticketRouter.post("/:id/notes", ticketController.addNote)

// Get ticket history
ticketRouter.get("/:id/history", ticketController.getTicketHistory)

export default ticketRouter
