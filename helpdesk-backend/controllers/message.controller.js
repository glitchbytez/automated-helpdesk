import mongoose from "mongoose"
import { catchAsync } from "../utils/catchAsync.js"
import { AppError } from "../utils/appError.js"

// Define the Message schema
const MessageSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, index: true },
    from: { type: String, required: true, enum: ['user', 'agent', 'system'] },
    text: { type: String, required: true },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    agentName: String,
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
}, { timestamps: true })

// Create the Message model using the main mongoose connection
const Message = mongoose.model('ChatMessage', MessageSchema)

/**
 * Get messages for a session
 */
export const getSessionMessages = catchAsync(async (req, res, next) => {
    const { sessionId } = req.params
    
    const messages = await Message.find({ sessionId }).sort('timestamp')
    
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
    
    const message = await Message.create(messageData)
    
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
    const messages = await Message.find().sort('-timestamp')
    
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
    
    const messages = await Message.find()
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
