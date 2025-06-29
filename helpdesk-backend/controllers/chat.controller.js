import mongoose from "mongoose"
import Chat from "../models/Chat.model.js"
import User from "../models/User.model.js"
import { catchAsync } from "../utils/catchAsync.js"
import { AppError } from "../utils/appError.js"

export const getMyChats = catchAsync(async (req, res, next) => {
    // Get chats where the current user is the agent
    const chats = await Chat.find({ agent: req.user.id })
        .populate("user", "firstName lastName email avatar")
        .sort("-lastMessage")

    res.status(200).json({
        status: "success",
        results: chats.length,
        data: {
            chats,
        },
    })
})

export const createChat = catchAsync(async (req, res, next) => {
    // Create a new chat
    const newChat = await Chat.create({
        user: req.body.user,
        agent: req.user.id,
        messages: [
            {
                sender: req.body.user,
                content: req.body.initialMessage,
                timestamp: Date.now(),
                read: false,
            },
        ],
        status: "active",
    })

    // Populate user data
    await newChat.populate("user", "firstName lastName email avatar")

    res.status(201).json({
        status: "success",
        data: {
            chat: newChat,
        },
    })
})

export const getChat = catchAsync(async (req, res, next) => {
    const chat = await Chat.findById(req.params.id)
        .populate("user", "firstName lastName email avatar")
        .populate("agent", "firstName lastName email avatar")

    if (!chat) {
        return next(new AppError("No chat found with that ID", 404))
    }

    res.status(200).json({
        status: "success",
        data: {
            chat,
        },
    })
})

export const getChatByTicketId = catchAsync(async (req, res, next) => {
    // Find chat with matching ticketId in customFields
    // Try both the string ID and the ObjectId format to handle different storage formats
    const chat = await Chat.findOne({
        $or: [
            { "customFields.ticketId": req.params.ticketId },
            { "customFields.ticketId": mongoose.Types.ObjectId.isValid(req.params.ticketId) ? 
                new mongoose.Types.ObjectId(req.params.ticketId) : req.params.ticketId }
        ]
    })
    .populate("user", "firstName lastName email avatar")
    .populate("agent", "firstName lastName email avatar")
    
    if (!chat) {
        // If no chat is found with the ticket ID, check if we can create one from session data
        // This is for tickets created by the chatbot server
        try {
            // Import the Session model from the chatbot server
            const mongoose = await import('mongoose')
            const conn = mongoose.default.createConnection('mongodb://localhost:27017/chatapp')
            const SessionSchema = new mongoose.default.Schema({
                sessionId: String,
                userName: String,
                userEmail: String,
                ticketId: String,
                requestLiveChat: Boolean,
                agentId: String,
                agentName: String,
                conversationEnded: Boolean,
                conversationEndedBy: String,
                conversationEndedAt: Date
            })
            const Session = conn.model('Session', SessionSchema)
            
            // Find the session with this ticket ID
            const session = await Session.findOne({ ticketId: req.params.ticketId })
            
            if (session) {
                // Find or create a user for this session
                let user = await User.findOne({ email: session.userEmail || 'anonymous@example.com' })
                
                if (!user) {
                    // Create a temporary user
                    user = await User.create({
                        firstName: session.userName || session.userEmail || 'Anonymous',
                        lastName: 'User',
                        email: session.userEmail || `anonymous-${Date.now()}@example.com`,
                        password: 'temporary' + Date.now(),
                        role: 'user'
                    })
                }
                
                // Create a chat for this session
                const newChat = await Chat.create({
                    user: user._id,
                    agent: req.user.id, // Current user (agent) viewing the ticket
                    status: 'active',
                    customFields: {
                        ticketId: req.params.ticketId,
                        sessionId: session.sessionId
                    }
                })
                
                // Populate user and agent data
                await newChat.populate("user", "firstName lastName email avatar")
                await newChat.populate("agent", "firstName lastName email avatar")
                
                // Import the Message model from the chatbot server
                const MessageSchema = new mongoose.default.Schema({
                    sessionId: String,
                    from: String,
                    text: String,
                    timestamp: { type: Date, default: Date.now }
                })
                const Message = conn.model('Message', MessageSchema)
                
                // Get messages for this session
                const sessionMessages = await Message.find({ sessionId: session.sessionId }).sort('timestamp')
                
                // Add messages to the chat
                if (sessionMessages && sessionMessages.length > 0) {
                    const chatMessages = sessionMessages.map(msg => ({
                        sender: msg.from === 'user' ? user._id : req.user.id,
                        content: msg.text,
                        timestamp: msg.timestamp,
                        read: true
                    }))
                    
                    newChat.messages = chatMessages
                    newChat.lastMessage = sessionMessages[sessionMessages.length - 1].timestamp
                    await newChat.save()
                }
                
                // Close the connection
                await conn.close()
                
                return res.status(200).json({
                    status: "success",
                    data: {
                        chat: newChat,
                    },
                })
            }
            
            // Close the connection
            await conn.close()
        } catch (error) {
            console.error('Error creating chat from session:', error)
        }
        
        return next(new AppError("No chat found with that ticket ID", 404))
    }
    
    // Check if current user is the agent
    if (chat.agent.toString() !== req.user.id && req.user.role !== "admin") {
        return next(new AppError("You are not authorized to access this chat", 403))
    }

    res.status(200).json({
        status: "success",
        data: {
            chat,
        },
    })
})

export const updateChat = catchAsync(async (req, res, next) => {
    const chat = await Chat.findById(req.params.id)

    if (!chat) {
        return next(new AppError("No chat found with that ID", 404))
    }

    // Check if current user is the agent
    if (chat.agent.toString() !== req.user.id && req.user.role !== "admin") {
        return next(new AppError("You are not authorized to update this chat", 403))
    }

    // Update chat
    const updatedChat = await Chat.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    })

    res.status(200).json({
        status: "success",
        data: {
            chat: updatedChat,
        },
    })
})

export const closeChat = catchAsync(async (req, res, next) => {
    const chat = await Chat.findById(req.params.id)

    if (!chat) {
        return next(new AppError("No chat found with that ID", 404))
    }

    // Check if current user is the agent
    if (chat.agent.toString() !== req.user.id && req.user.role !== "admin") {
        return next(new AppError("You are not authorized to close this chat", 403))
    }

    // Close chat
    chat.status = "closed"
    await chat.save()

    res.status(200).json({
        status: "success",
        data: {
            chat,
        },
    })
})

export const addMessage = catchAsync(async (req, res, next) => {
    const chat = await Chat.findById(req.params.id)

    if (!chat) {
        return next(new AppError("No chat found with that ID", 404))
    }

    // Check if current user is the agent
    if (chat.agent.toString() !== req.user.id && req.user.role !== "admin") {
        return next(new AppError("You are not authorized to add messages to this chat", 403))
    }

    // Check if chat is active
    if (chat.status !== "active") {
        return next(new AppError("Cannot add messages to a closed chat", 400))
    }

    // Add message
    chat.messages.push({
        sender: req.user.id,
        content: req.body.content,
        timestamp: Date.now(),
        read: false,
    })

    // Update lastMessage timestamp
    chat.lastMessage = Date.now()

    await chat.save()

    res.status(201).json({
        status: "success",
        data: {
            chat,
        },
    })
})

export const markAsRead = catchAsync(async (req, res, next) => {
    const chat = await Chat.findById(req.params.id)

    if (!chat) {
        return next(new AppError("No chat found with that ID", 404))
    }

    // Check if current user is the agent
    if (chat.agent.toString() !== req.user.id && req.user.role !== "admin") {
        return next(new AppError("You are not authorized to update this chat", 403))
    }

    // Mark all messages as read
    chat.messages.forEach((message) => {
        if (message.sender.toString() !== req.user.id) {
            message.read = true
        }
    })

    await chat.save()

    res.status(200).json({
        status: "success",
        data: {
            chat,
        },
    })
})
