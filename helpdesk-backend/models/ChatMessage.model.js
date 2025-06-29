import mongoose from "mongoose"

const chatMessageSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, index: true },
    from: { type: String, required: true, enum: ['user', 'agent', 'system'] },
    text: { type: String, required: true },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    agentName: String,
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
}, { timestamps: true })

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema)

export default ChatMessage 