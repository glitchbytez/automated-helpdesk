import mongoose from "mongoose"

const chatSessionSchema = new mongoose.Schema({
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

const ChatSession = mongoose.model('ChatSession', chatSessionSchema)

export default ChatSession 