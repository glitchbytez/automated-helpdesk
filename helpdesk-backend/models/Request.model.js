import mongoose from "mongoose"

const requestSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["account_opening", "password_reset"],
            required: [true, "Request type is required"],
        },
        requesterEmail: {
            type: String,
            required: [true, "Requester email is required"],
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
        },
        requesterName: {
            type: String,
            required: [true, "Requester name is required"],
            trim: true,
        },
        requesterPhone: {
            type: String,
            trim: true,
        },
        department: {
            type: String,
            trim: true,
        },
        jobTitle: {
            type: String,
            trim: true,
        },
        reason: {
            type: String,
            required: [true, "Reason is required"],
            trim: true,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        reviewedAt: {
            type: Date,
        },
        reviewNotes: {
            type: String,
            trim: true,
        },
        // For password reset requests
        existingUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        // For account opening requests
        requestedRole: {
            type: String,
            enum: ["agent", "limited"],
            default: "agent",
        },
        requestedTeam: {
            type: String,
            enum: ["support", "technical", "billing"],
            default: "support",
        },
        // Additional metadata
        submittedFrom: {
            type: String,
            default: "login_page",
        },
        ipAddress: {
            type: String,
        },
        userAgent: {
            type: String,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
)

// Virtual for request age in hours
requestSchema.virtual("ageInHours").get(function () {
    return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60))
})

// Virtual for formatted status
requestSchema.virtual("statusDisplay").get(function () {
    return this.status.charAt(0).toUpperCase() + this.status.slice(1)
})

// Index for efficient queries
requestSchema.index({ status: 1, createdAt: -1 })
requestSchema.index({ type: 1, status: 1 })
requestSchema.index({ requesterEmail: 1 })
requestSchema.index({ assignedTo: 1 })

const Request = mongoose.model("Request", requestSchema)

export default Request 