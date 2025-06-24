import mongoose from "mongoose"

const messageSchema = new mongoose.Schema(
    {
        ticket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Added for email-based conversations
        subject: {
            type: String,
            trim: true,
        },
        content: {
            type: String,
            required: [true, "Message content is required"],
        },
        attachments: [
            {
                filename: String,
                path: String,
                mimetype: String,
                size: Number,
            },
        ],
        isInternal: {
            type: Boolean,
            default: false,
        },
        // Added for email-based conversations
        metadata: {
            messageType: {
                type: String,
                enum: ['chat', 'email'],
                default: 'chat'
            },
            recipientEmail: String,
            emailStatus: {
                type: String,
                enum: ['draft', 'sending', 'sent', 'delivered', 'failed'],
                default: 'draft'
            },
            headers: Object,
            emailId: String
        },
        readBy: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                readAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
)

const Message = mongoose.model("Message", messageSchema)

export default Message
