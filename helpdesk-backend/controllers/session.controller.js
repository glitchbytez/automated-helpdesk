import mongoose from "mongoose"
import { catchAsync } from "../utils/catchAsync.js"
import { AppError } from "../utils/appError.js"

// Define the Session schema
const SessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    userName: String,
    userEmail: String,
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
    requestLiveChat: { type: Boolean, default: false },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    agentName: String,
    conversationEnded: { type: Boolean, default: false },
    conversationEndedBy: String,
    conversationEndedAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true })

// Create the Session model using the main mongoose connection
const Session = mongoose.model('ChatSession', SessionSchema)

/**
 * Get a session by ID
 */
export const getSession = catchAsync(async (req, res, next) => {
    const { sessionId } = req.params
    
    const session = await Session.findOne({ sessionId })
    
    if (!session) {
        return next(new AppError("Session not found", 404))
    }
    
    res.status(200).json({
        status: "success",
        data: {
            session
        }
    })
})

/**
 * Create a new session
 */
export const createSession = catchAsync(async (req, res, next) => {
    const sessionData = req.body
    
    const session = await Session.create(sessionData)
    
    res.status(201).json({
        status: "success",
        data: {
            session
        }
    })
})

/**
 * Update a session
 */
export const updateSession = catchAsync(async (req, res, next) => {
    const { sessionId } = req.params
    const updateData = req.body
    
    const session = await Session.findOneAndUpdate(
        { sessionId },
        updateData,
        { new: true, runValidators: true }
    )
    
    if (!session) {
        return next(new AppError("Session not found", 404))
    }
    
    res.status(200).json({
        status: "success",
        data: {
            session
        }
    })
})

/**
 * Get all sessions
 */
export const getAllSessions = catchAsync(async (req, res, next) => {
    const sessions = await Session.find()
    
    res.status(200).json({
        status: "success",
        results: sessions.length,
        data: {
            sessions
        }
    })
})

/**
 * Get active chat sessions
 */
export const getActiveSessions = catchAsync(async (req, res, next) => {
    const sessions = await Session.find({
        conversationEnded: { $ne: true }
    })
    
    res.status(200).json({
        status: "success",
        results: sessions.length,
        data: {
            sessions
        }
    })
})

/**
 * End a conversation
 */
export const endConversation = catchAsync(async (req, res, next) => {
    const { sessionId } = req.params
    const { endedBy } = req.body
    
    const session = await Session.findOneAndUpdate(
        { sessionId },
        {
            conversationEnded: true,
            conversationEndedBy: endedBy || "system",
            conversationEndedAt: new Date()
        },
        { new: true }
    )
    
    if (!session) {
        return next(new AppError("Session not found", 404))
    }
    
    res.status(200).json({
        status: "success",
        data: {
            session
        }
    })
})
