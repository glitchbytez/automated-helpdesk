import { catchAsync } from "../utils/catchAsync.js"
import { AppError } from "../utils/appError.js"
import ChatMessage from "../models/ChatMessage.model.js"

/**
 * Get messages for a session
 */
export const getSessionMessages = catchAsync(async (req, res, next) => {
    const { sessionId } = req.params
    
    const messages = await ChatMessage.find({ sessionId }).sort('timestamp')
    
    res.status(200).json({
        status: "success",
        results: messages.length,
        data: {
            messages
        }
    })
})

/**
 * Create a new message
 */
export const createMessage = catchAsync(async (req, res, next) => {
    const messageData = req.body
    
    const message = await ChatMessage.create(messageData)
    
    res.status(201).json({
        status: "success",
        data: {
            message
        }
    })
})

/**
 * Get all messages
 */
export const getAllMessages = catchAsync(async (req, res, next) => {
    const messages = await ChatMessage.find().sort('-timestamp')
    
    res.status(200).json({
        status: "success",
        results: messages.length,
        data: {
            messages
        }
    })
})

/**
 * Get latest messages
 */
export const getLatestMessages = catchAsync(async (req, res, next) => {
    const { limit = 50 } = req.query
    
    const messages = await ChatMessage.find()
        .sort('-timestamp')
        .limit(parseInt(limit))
    
    res.status(200).json({
        status: "success",
        results: messages.length,
        data: {
            messages
        }
    })
})
