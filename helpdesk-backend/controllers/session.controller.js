import { catchAsync } from "../utils/catchAsync.js"
import { AppError } from "../utils/appError.js"
import ChatSession from "../models/ChatSession.model.js"

/**
 * Get a session by ID
 */
export const getSession = catchAsync(async (req, res, next) => {
    const { sessionId } = req.params
    
    const session = await ChatSession.findOne({ sessionId })
    
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
    
    const session = await ChatSession.create(sessionData)
    
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
    
    const session = await ChatSession.findOneAndUpdate(
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
    const sessions = await ChatSession.find().sort({ createdAt: -1 })
    
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
    const sessions = await ChatSession.find({
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
    
    const session = await ChatSession.findOneAndUpdate(
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
