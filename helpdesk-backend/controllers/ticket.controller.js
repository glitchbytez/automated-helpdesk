import mongoose from "mongoose"
import Ticket from "../models/Ticket.model.js"
import Message from "../models/Message.model.js"
import Note from "../models/Note.model.js"
import TicketHistory from "../models/TicketHistory.model.js"
import Chat from "../models/Chat.model.js"
import { catchAsync } from "../utils/catchAsync.js"
import { AppError } from "../utils/appError.js"
import { sendTicketCreatedEmail, sendTicketAssignedEmail, sendTicketStatusChangedEmail } from "../utils/email.js"

// Internal methods for public routes (no authentication required)

/**
 * Create a ticket without authentication (for chatbot) - proper controller function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const createTicketInternal = catchAsync(async (req, res, next) => {
    // Set creator to 'chatbot' instead of req.user.id
    req.body.creator = 'chatbot'
    
    // Make sure requester fields are provided
    if (!req.body.requester || !req.body.requester.email || !req.body.requester.registrationNumber) {
        return next(new AppError("Requester email and registration number are required", 400))
    }

    // Let the model generate ticketId automatically via pre-save middleware
    const newTicket = await Ticket.create(req.body)

    // Add to ticket history
    await TicketHistory.create({
        ticket: newTicket._id,
        action: "Ticket created",
        actor: 'chatbot',
    })
    
    // Send ticket creation email to requester
    try {
        await sendTicketCreatedEmail(newTicket, newTicket.requester.email)
    } catch (error) {
        console.error('Failed to send ticket creation email:', error.message)
        // Don't fail the ticket creation if email sending fails
    }
    
    // Create a corresponding chat document
    try {
        // For chatbot tickets, we need to extract the session ID from customFields
        const sessionId = req.body.customFields?.sessionId;
        
        // For chatbot tickets, we need to handle the user field differently
        // Since requester is not a User document, we'll use the creator or a default system user
        const chatUserId = newTicket.creator === 'chatbot' ? '60f1a5b9e6b3f32d8cbc0f1e' : newTicket.creator;
        
        // Create a chat document linked to this ticket
        const newChat = await Chat.create({
            user: chatUserId, // Use creator or default system user ID
            agent: newTicket.assignee || '60f1a5b9e6b3f32d8cbc0f1e', // Will be assigned later
            status: 'active',
            customFields: {
                ticketId: newTicket._id.toString(),
                subject: newTicket.subject,
                sessionId: sessionId,
                requesterEmail: newTicket.requester.email,  // Store requester info in customFields
                requesterName: newTicket.requester.name,
                requesterRegNumber: newTicket.requester.registrationNumber
            }
        })
        
        console.log(`Created chat document ${newChat._id} for chatbot ticket ${newTicket._id}`)
    } catch (error) {
        // Don't fail the ticket creation if chat creation fails
        console.error(`Error creating chat document for chatbot ticket ${newTicket._id}:`, error)
    }

    res.status(201).json({
        status: "success",
        data: {
            ticket: newTicket,
        },
    })
})

/**
 * Add a message to a ticket without authentication (for chatbot)
 * @param {string} ticketId - Ticket ID
 * @param {Object} messageData - Message data
 * @returns {Promise<Object>} Created message
 */
export const addMessageInternal = async (ticketId, messageData) => {
    // Find the ticket
    const ticket = await Ticket.findById(ticketId)
    
    if (!ticket) {
        throw new Error('Ticket not found')
    }
    
    // Create the message
    const newMessage = await Message.create({
        ticket: ticketId,
        content: messageData.content,
        sender: messageData.sender || 'system',
        isInternal: messageData.isInternal || false
    })
    
    // Update ticket last activity
    ticket.lastActivity = Date.now()
    await ticket.save()
    
    return newMessage
}

/**
 * Update a ticket without authentication (for chatbot)
 * @param {string} ticketId - Ticket ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated ticket
 */
export const updateTicketInternal = async (ticketId, updateData) => {
    // Find and update the ticket
    const ticket = await Ticket.findByIdAndUpdate(
        ticketId,
        updateData,
        { new: true, runValidators: true }
    )
    
    if (!ticket) {
        throw new Error('Ticket not found')
    }
    
    // Create history entry
    await TicketHistory.create({
        ticket: ticketId,
        action: 'update',
        details: 'Ticket updated from chatbot',
        performedBy: 'system'
    })
    
    return ticket
}

export const getAllTickets = catchAsync(async (req, res, next) => {
    // Build query
    const queryObj = { ...req.query }
    const excludedFields = ["page", "sort", "limit", "fields"]
    excludedFields.forEach((el) => delete queryObj[el])

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj)
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`)

    let query = Ticket.find(JSON.parse(queryStr))
        .populate("requester", "firstName lastName email avatar")
        .populate("assignee", "firstName lastName email avatar")

    // Sorting
    if (req.query.sort) {
        const sortBy = req.query.sort.split(",").join(" ")
        query = query.sort(sortBy)
    } else {
        query = query.sort("-createdAt")
    }

    // Field limiting
    if (req.query.fields) {
        const fields = req.query.fields.split(",").join(" ")
        query = query.select(fields)
    } else {
        query = query.select("-__v")
    }

    // Pagination
    const page = req.query.page * 1 || 1
    const limit = req.query.limit * 1 || 100
    const skip = (page - 1) * limit

    query = query.skip(skip).limit(limit)

    // Execute query
    const tickets = await query

    res.status(200).json({
        status: "success",
        results: tickets.length,
        data: {
            tickets,
        },
    })
})

export const getMyTickets = catchAsync(async (req, res, next) => {
    const tickets = await Ticket.find({ assignee: req.user.id })
        .populate("requester", "firstName lastName email avatar")
        .sort("-updatedAt")

    res.status(200).json({
        status: "success",
        results: tickets.length,
        data: {
            tickets,
        },
    })
})

export const getUnassignedTickets = catchAsync(async (req, res, next) => {
    const tickets = await Ticket.find({ assignee: null })
        .populate("requester", "firstName lastName email avatar")
        .sort("-createdAt")

    res.status(200).json({
        status: "success",
        results: tickets.length,
        data: {
            tickets,
        },
    })
})

export const getTicket = catchAsync(async (req, res, next) => {
    const ticket = await Ticket.findById(req.params.id)
        .populate("requester", "firstName lastName email avatar phone")
        .populate("assignee", "firstName lastName email avatar")

    if (!ticket) {
        return next(new AppError("No ticket found with that ID", 404))
    }

    // Get messages
    const messages = await Message.find({ ticket: ticket._id })
        .populate("sender", "firstName lastName email avatar")
        .sort("createdAt")

    // Get notes
    const notes = await Note.find({ ticket: ticket._id })
        .populate("author", "firstName lastName email avatar")
        .sort("-createdAt")

    res.status(200).json({
        status: "success",
        data: {
            ticket,
            messages,
            notes,
        },
    })
})

export const createTicket = catchAsync(async (req, res, next) => {
    // Set creator to current user
    req.body.creator = req.user.id
    
    // Make sure requester fields are provided
    if (!req.body.requester || !req.body.requester.email || !req.body.requester.registrationNumber) {
        return next(new AppError("Requester email and registration number are required", 400))
    }

    // Let the model generate ticketId automatically via pre-save middleware
    const newTicket = await Ticket.create(req.body)

    // Add to ticket history
    await TicketHistory.create({
        ticket: newTicket._id,
        action: "Ticket created",
        actor: req.user.id,
    })
    
    // Send ticket creation email to requester
    try {
        await sendTicketCreatedEmail(newTicket, newTicket.requester.email)
    } catch (error) {
        console.error('Failed to send ticket creation email:', error.message)
        // Don't fail the ticket creation if email sending fails
    }
    
    // Create a corresponding chat document
    try {
        // For regular tickets, use the creator (current user) as the chat user
        // The requester field is just contact info, not a User document reference
        const chatUserId = req.user.id;
        
        // Create a chat document linked to this ticket
        const newChat = await Chat.create({
            user: chatUserId, // Use the creator (current user)
            agent: newTicket.assignee || req.user.id,
            status: 'active',
            customFields: {
                ticketId: newTicket._id.toString(),
                subject: newTicket.subject,
                requesterEmail: newTicket.requester.email,  // Store requester info in customFields
                requesterName: newTicket.requester.name,
                requesterRegNumber: newTicket.requester.registrationNumber
            }
        })
        
        console.log(`Created chat document ${newChat._id} for ticket ${newTicket._id}`)
    } catch (error) {
        // Don't fail the ticket creation if chat creation fails
        console.error(`Error creating chat document for ticket ${newTicket._id}:`, error)
    }

    res.status(201).json({
        status: "success",
        data: {
            ticket: newTicket,
        },
    })
})

export const updateTicket = catchAsync(async (req, res, next) => {
    // Get the current ticket to check for status changes
    const currentTicket = await Ticket.findById(req.params.id)
    
    if (!currentTicket) {
        return next(new AppError("No ticket found with that ID", 404))
    }

    // Store old status for email notification
    const oldStatus = currentTicket.status
    const newStatus = req.body.status

    // Set _modifiedBy for pre-save middleware
    req.body._modifiedBy = req.user.id

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    })

    // Send status change email if status was updated
    if (newStatus && oldStatus !== newStatus) {
        try {
            await sendTicketStatusChangedEmail(ticket, ticket.requester.email, oldStatus, newStatus)
        } catch (error) {
            console.error('Failed to send ticket status change email:', error.message)
            // Don't fail the ticket update if email sending fails
        }
    }

    res.status(200).json({
        status: "success",
        data: {
            ticket,
        },
    })
})

export const deleteTicket = catchAsync(async (req, res, next) => {
    const ticket = await Ticket.findByIdAndDelete(req.params.id)

    if (!ticket) {
        return next(new AppError("No ticket found with that ID", 404))
    }

    // Delete associated messages and notes
    await Message.deleteMany({ ticket: req.params.id })
    await Note.deleteMany({ ticket: req.params.id })
    await TicketHistory.deleteMany({ ticket: req.params.id })

    res.status(204).json({
        status: "success",
        data: null,
    })
})

export const assignTicket = catchAsync(async (req, res, next) => {
    const { assignee } = req.body

    // If assignee is 'self', assign to current user
    const assigneeId = assignee === "self" ? req.user.id : assignee

    const ticket = await Ticket.findByIdAndUpdate(
        req.params.id,
        {
            assignee: assigneeId,
            _modifiedBy: req.user.id,
        },
        { new: true, runValidators: true },
    ).populate("assignee", "firstName lastName email")

    if (!ticket) {
        return next(new AppError("No ticket found with that ID", 404))
    }

    // Send ticket assignment email to requester
    try {
        await sendTicketAssignedEmail(ticket, ticket.requester.email)
    } catch (error) {
        console.error('Failed to send ticket assignment email:', error.message)
        // Don't fail the ticket assignment if email sending fails
    }

    res.status(200).json({
        status: "success",
        data: {
            ticket,
        },
    })
})

// Note: There seems to be an existing assignTicket function defined elsewhere that we can't locate
// We'll leave it as is and focus on fixing the frontend implementation

export const assignToSelf = catchAsync(async (req, res, next) => {
    // Get the current user's ID
    const currentUserId = req.user.id
    
    // First, find the ticket to check its status
    const existingTicket = await Ticket.findById(req.params.id)

    if (!existingTicket) {
        return next(new AppError("No ticket found with that ID", 404))
    }
    
    // Check if the ticket is closed
    if (existingTicket.status === 'Closed') {
        return next(new AppError("Cannot assign a closed ticket", 400))
    }
    
    // Find and update the ticket
    const ticket = await Ticket.findByIdAndUpdate(
        req.params.id,
        {
            assignee: currentUserId,
            _modifiedBy: currentUserId,
        },
        { new: true, runValidators: true },
    ).populate("requester", "firstName lastName email avatar")
      .populate("assignee", "firstName lastName email avatar")
    
    // Add to ticket history
    await TicketHistory.create({
        ticket: req.params.id,
        action: "Ticket assigned to self",
        actor: currentUserId,
    })

    // Send ticket assignment email to requester
    try {
        await sendTicketAssignedEmail(ticket, ticket.requester.email)
    } catch (error) {
        console.error('Failed to send ticket assignment email:', error.message)
        // Don't fail the ticket assignment if email sending fails
    }

    res.status(200).json({
        status: "success",
        data: {
            ticket,
        },
    })
})

export const addMessage = catchAsync(async (req, res, next) => {
    const ticket = await Ticket.findById(req.params.id)

    if (!ticket) {
        return next(new AppError("No ticket found with that ID", 404))
    }

    const newMessage = await Message.create({
        ticket: req.params.id,
        sender: req.user.id,
        content: req.body.content,
        attachments: req.body.attachments,
        isInternal: req.body.isInternal || false,
    })

    // Update ticket's updatedAt
    await Ticket.findByIdAndUpdate(req.params.id, {
        updatedAt: Date.now(),
        _modifiedBy: req.user.id,
    })

    // Add to ticket history
    await TicketHistory.create({
        ticket: req.params.id,
        action: "Message added",
        actor: req.user.id,
    })

    res.status(201).json({
        status: "success",
        data: {
            message: newMessage,
        },
    })
})

export const addNote = catchAsync(async (req, res, next) => {
    const ticket = await Ticket.findById(req.params.id)

    if (!ticket) {
        return next(new AppError("No ticket found with that ID", 404))
    }

    const newNote = await Note.create({
        ticket: req.params.id,
        author: req.user.id,
        content: req.body.content,
    })

    // Add to ticket history
    await TicketHistory.create({
        ticket: req.params.id,
        action: "Note added",
        actor: req.user.id,
    })

    res.status(201).json({
        status: "success",
        data: {
            note: newNote,
        },
    })
})

export const getTicketMessages = catchAsync(async (req, res, next) => {
    const ticket = await Ticket.findById(req.params.id)

    if (!ticket) {
        return next(new AppError("No ticket found with that ID", 404))
    }

    // Get all messages for this ticket that are not internal
    const messages = await Message.find({ 
        ticket: req.params.id,
        isInternal: false
    })
    .sort({ createdAt: 1 })
    .populate("sender", "firstName lastName email avatar role")

    // Format messages for the email-based conversation UI
    const formattedMessages = messages.map(msg => ({
        id: msg._id,
        subject: msg.subject || `Re: ${ticket.subject}`,
        content: msg.content,
        createdAt: msg.createdAt,
        fromAgent: msg.sender.role === 'agent' || msg.sender.role === 'admin',
        attachments: msg.attachments || []
    }))

    res.status(200).json({
        status: "success",
        data: {
            messages: formattedMessages
        }
    })
})

export const sendTicketEmail = catchAsync(async (req, res, next) => {
    const ticket = await Ticket.findById(req.params.id)

    if (!ticket) {
        return next(new AppError("No ticket found with that ID", 404))
    }

    // Create a new message with email metadata
    const newMessage = await Message.create({
        ticket: req.params.id,
        sender: req.user.id,
        subject: req.body.subject,
        content: req.body.message,
        attachments: req.body.attachments || [],
        isInternal: false,
        metadata: {
            messageType: 'email',
            recipientEmail: req.body.recipientEmail,
            emailStatus: 'sent'
        }
    })

    // Update ticket's updatedAt
    await Ticket.findByIdAndUpdate(req.params.id, {
        updatedAt: Date.now(),
        _modifiedBy: req.user.id,
    })

    // Add to ticket history
    await TicketHistory.create({
        ticket: req.params.id,
        action: "Email sent",
        actor: req.user.id,
        details: `Email sent to ${req.body.recipientEmail} with subject: ${req.body.subject}`
    })

    // In a real implementation, you would send the actual email here using a service like Nodemailer, SendGrid, etc.
    // For now, we'll just simulate it by logging
    console.log(`Email would be sent to ${req.body.recipientEmail} with subject: ${req.body.subject}`)

    // Return the created message with sender info
    const populatedMessage = await Message.findById(newMessage._id).populate("sender", "firstName lastName email avatar role")

    // Format the message for the response
    const formattedMessage = {
        id: populatedMessage._id,
        subject: populatedMessage.subject,
        content: populatedMessage.content,
        createdAt: populatedMessage.createdAt,
        fromAgent: populatedMessage.sender.role === 'agent' || populatedMessage.sender.role === 'admin',
        attachments: populatedMessage.attachments || []
    }

    res.status(201).json({
        status: "success",
        data: {
            message: formattedMessage
        }
    })
})

export const getTicketHistory = catchAsync(async (req, res, next) => {
    const ticket = await Ticket.findById(req.params.id)

    if (!ticket) {
        return next(new AppError("No ticket found with that ID", 404))
    }

    // Get history without populate first
    const rawHistory = await TicketHistory.find({ ticket: req.params.id })
        .sort("-createdAt")

    // Manually populate actor field for ObjectIds only
    const history = await Promise.all(rawHistory.map(async (item) => {
        const historyItem = item.toObject()
        
        // Check if actor is an ObjectId and populate it
        if (historyItem.actor && mongoose.Types.ObjectId.isValid(historyItem.actor)) {
            try {
                // Import User model
                const User = mongoose.model('User')
                const user = await User.findById(historyItem.actor).select('firstName lastName email avatar')
                if (user) {
                    historyItem.actor = user
                }
            } catch (error) {
                console.error('Error populating actor:', error)
                // Keep the original actor value if population fails
            }
        }
        
        return historyItem
    }))

    res.status(200).json({
        status: "success",
        data: {
            history,
        },
    })
})

export const getTicketStats = catchAsync(async (req, res, next) => {
    const stats = await Ticket.aggregate([
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
                avgResponseTime: { $avg: "$responseTime" },
            },
        },
    ])

    const priorityStats = await Ticket.aggregate([
        {
            $group: {
                _id: "$priority",
                count: { $sum: 1 },
            },
        },
    ])

    res.status(200).json({
        status: "success",
        data: {
            statusStats: stats,
            priorityStats,
        },
    })
})

/**
 * Get ticket status by ticketId (public access)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const getTicketStatus = catchAsync(async (req, res, next) => {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId })
        .select('ticketId status priority subject updatedAt')
        .lean()

    if (!ticket) {
        return next(new AppError("No ticket found with that ID", 404))
    }

    res.status(200).json({
        status: "success",
        data: {
            ticket
        }
    })
})

export const deleteAllTickets = catchAsync(async (req, res, next) => {
    // Get count of tickets before deletion for response
    const ticketCount = await Ticket.countDocuments()
    
    if (ticketCount === 0) {
        return res.status(200).json({
            status: "success",
            message: "No tickets found to delete",
            data: {
                deletedCount: 0
            }
        })
    }

    // Delete all associated data first
    await Message.deleteMany({})
    await Note.deleteMany({})
    await TicketHistory.deleteMany({})
    
    // Delete all tickets
    const result = await Ticket.deleteMany({})

    res.status(200).json({
        status: "success",
        message: `Successfully deleted ${result.deletedCount} tickets and all associated data`,
        data: {
            deletedCount: result.deletedCount
        }
    })
})




