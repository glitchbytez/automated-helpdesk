import mongoose from "mongoose"

const ticketHistorySchema = new mongoose.Schema(
    {
        ticket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            required: true,
        },
        action: {
            type: String,
            required: true,
        },
        actor: {
            type: mongoose.Schema.Types.Mixed,
            validate: {
                validator: function(value) {
                    // Allow ObjectId or specific string values, or null/undefined
                    return !value || mongoose.Types.ObjectId.isValid(value) || 
                           ['chatbot', 'system', 'api'].includes(value);
                },
                message: 'Actor must be a valid ObjectId or one of: chatbot, system, api'
            }
        },
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
)

const TicketHistory = mongoose.model("TicketHistory", ticketHistorySchema)

export default TicketHistory
