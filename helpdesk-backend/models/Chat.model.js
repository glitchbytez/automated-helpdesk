import mongoose from "mongoose"

const chatSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        agent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        status: {
            type: String,
            enum: ["active", "closed"],
            default: "active",
        },
        messages: [
            {
                sender: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                content: {
                    type: String,
                    required: true,
                },
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
                read: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
        lastMessage: {
            type: Date,
            default: Date.now,
        },
        ticket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
        },
    },
    {
        timestamps: true,
    }
)

const Chat = mongoose.model("Chat", chatSchema)

export default Chat
