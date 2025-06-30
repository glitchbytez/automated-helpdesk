import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, "First name is required"],
            trim: true,
        },
        lastName: {
            type: String,
            required: [true, "Last name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 8,
            select: false,
        },
        role: {
            type: String,
            enum: ["admin", "agent", "limited"],
            default: "agent",
        },
        team: {
            type: String,
            enum: ["support", "technical", "billing"],
            default: "support",
        },
        avatar: {
            type: String,
            default: "",
        },
        phone: {
            type: String,
            trim: true,
        },
        jobTitle: {
            type: String,
            trim: true,
        },
        bio: {
            type: String,
        },
        status: {
            type: String,
            enum: ["active", "inactive", "away"],
            default: "active",
        },
        permissions: [
            {
                type: String,
                enum: [
                    "viewTickets",
                    "createTickets",
                    "assignTickets",
                    "deleteTickets",
                    "manageAgents",
                    "manageSettings",
                    "manageKnowledgeBase",
                ],
            },
        ],
        passwordResetToken: String,
        passwordResetExpires: Date,
        passwordChangedAt: Date,
        requirePasswordChange: {
            type: Boolean,
            default: false,
        },
        lastActive: {
            type: Date,
            default: Date.now,
        },
        notificationPreferences: {
            email: {
                type: Boolean,
                default: true,
            },
            desktop: {
                type: Boolean,
                default: true,
            },
            newTicket: {
                type: Boolean,
                default: true,
            },
            ticketUpdates: {
                type: Boolean,
                default: true,
            },
            ticketAssigned: {
                type: Boolean,
                default: true,
            },
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
)

// Virtual for full name
userSchema.virtual("fullName").get(function () {
    return `${this.firstName} ${this.lastName}`
})

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next()

    this.password = await bcrypt.hash(this.password, 12)

    if (this.isModified("password") && !this.isNew) {
        this.passwordChangedAt = Date.now() - 1000
    }

    next()
})

// Method to check if password is correct
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)
}

// Method to check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = Number.parseInt(this.passwordChangedAt.getTime() / 1000, 10)
        return JWTTimestamp < changedTimestamp
    }
    return false
}

// Method to create password reset token
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex")

    this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000 // 10 minutes

    return resetToken
}

const User = mongoose.model("User", userSchema)

export default User
