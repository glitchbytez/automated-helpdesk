import Request from "../models/Request.model.js"
import User from "../models/User.model.js"
import { AppError } from "../utils/appError.js"
import { catchAsync } from "../utils/catchAsync.js"
import { sendEmail } from "../utils/email.js"
import crypto from "crypto"

// Create a new request (public endpoint)
export const createRequest = catchAsync(async (req, res, next) => {
    const { type, requesterEmail, requesterName, requesterPhone, department, jobTitle, reason, requestedRole, requestedTeam, priority } = req.body

    // Validate required fields
    if (!type || !requesterEmail || !requesterName || !reason) {
        return next(new AppError("Missing required fields", 400))
    }

    // For password reset requests, check if user exists
    let existingUserId = null
    if (type === "password_reset") {
        const existingUser = await User.findOne({ email: requesterEmail })
        if (!existingUser) {
            return next(new AppError("No user found with that email address", 404))
        }
        existingUserId = existingUser._id
    }

    // For account opening requests, check if user already exists
    if (type === "account_opening") {
        const existingUser = await User.findOne({ email: requesterEmail })
        if (existingUser) {
            return next(new AppError("An account with this email already exists", 400))
        }
    }

    // Get client IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress
    const userAgent = req.get("User-Agent")

    // Create the request
    const request = await Request.create({
        type,
        requesterEmail,
        requesterName,
        requesterPhone,
        department,
        jobTitle,
        reason,
        requestedRole: type === "account_opening" ? requestedRole : undefined,
        requestedTeam: type === "account_opening" ? requestedTeam : undefined,
        priority: priority || "medium",
        existingUserId,
        ipAddress,
        userAgent,
        submittedFrom: "login_page",
    })

    // Send notification email to admins
    try {
        const admins = await User.find({ role: "admin" })
        const adminEmails = admins.map(admin => admin.email)

        if (adminEmails.length > 0) {
            const requestTypeDisplay = type === "account_opening" ? "Account Access" : "Password Reset"
            const subject = `🔔 New ${requestTypeDisplay} Request - Action Required`
            
            const message = `
Hello Campus Support Administrator,

A new ${requestTypeDisplay.toLowerCase()} request has been submitted and requires your review.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 REQUEST DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Requester: ${requesterName}
📧 Email: ${requesterEmail}
📝 Request Type: ${requestTypeDisplay}
${department ? `🏢 Department: ${department}` : ""}
${jobTitle ? `💼 Job Title: ${jobTitle}` : ""}

💬 Reason for Request:
"${reason}"

🕒 Submitted: ${new Date().toLocaleString()}
🔗 IP Address: ${ipAddress || "Unknown"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please log in to the admin dashboard to review and process this request:
👉 ${process.env.FRONTEND_URL}/requests

You can:
✅ Approve the request
❌ Reject the request
📝 Add review notes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Best regards,
Campus Support System
            `

            // Send email to all admins
            for (const email of adminEmails) {
                await sendEmail({
                    email,
                    subject,
                    message,
                })
            }
        }
    } catch (emailError) {
        console.error("Failed to send notification email:", emailError)
        // Don't fail the request creation if email fails
    }

    res.status(201).json({
        status: "success",
        message: "Request submitted successfully. An administrator will review your request shortly.",
        data: {
            request: {
                id: request._id,
                type: request.type,
                status: request.status,
                createdAt: request.createdAt,
            },
        },
    })
})

// Get all requests (admin only)
export const getAllRequests = catchAsync(async (req, res, next) => {
    const { status, type, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = req.query

    // Build filter object
    const filter = {}
    if (status) filter.status = status
    if (type) filter.type = type

    // Build sort object
    const sort = {}
    sort[sortBy] = sortOrder === "desc" ? -1 : 1

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute query
    const requests = await Request.find(filter)
        .populate("assignedTo", "firstName lastName email")
        .populate("reviewedBy", "firstName lastName email")
        .populate("existingUserId", "firstName lastName email")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))

    // Get total count for pagination
    const totalRequests = await Request.countDocuments(filter)

    res.status(200).json({
        status: "success",
        results: requests.length,
        totalPages: Math.ceil(totalRequests / limit),
        currentPage: parseInt(page),
        data: {
            requests,
        },
    })
})

// Get request by ID (admin only)
export const getRequest = catchAsync(async (req, res, next) => {
    const request = await Request.findById(req.params.id)
        .populate("assignedTo", "firstName lastName email")
        .populate("reviewedBy", "firstName lastName email")
        .populate("existingUserId", "firstName lastName email")

    if (!request) {
        return next(new AppError("Request not found", 404))
    }

    res.status(200).json({
        status: "success",
        data: {
            request,
        },
    })
})

// Update request (admin only)
export const updateRequest = catchAsync(async (req, res, next) => {
    const { status, priority, assignedTo, reviewNotes } = req.body

    const request = await Request.findById(req.params.id)
    if (!request) {
        return next(new AppError("Request not found", 404))
    }

    // Update fields
    if (status) request.status = status
    if (priority) request.priority = priority
    if (assignedTo) request.assignedTo = assignedTo
    if (reviewNotes) request.reviewNotes = reviewNotes

    // If status is being changed to approved or rejected, set review info
    if (status && status !== "pending") {
        request.reviewedBy = req.user._id
        request.reviewedAt = new Date()
    }

    await request.save()

    // Populate the response
    await request.populate("assignedTo", "firstName lastName email")
    await request.populate("reviewedBy", "firstName lastName email")
    await request.populate("existingUserId", "firstName lastName email")

    res.status(200).json({
        status: "success",
        data: {
            request,
        },
    })
})

// Approve request (admin only)
export const approveRequest = catchAsync(async (req, res, next) => {
    const { reviewNotes } = req.body

    const request = await Request.findById(req.params.id)
    if (!request) {
        return next(new AppError("Request not found", 404))
    }

    if (request.status !== "pending") {
        return next(new AppError("Request has already been processed", 400))
    }

    // Update request status
    request.status = "approved"
    request.reviewedBy = req.user._id
    request.reviewedAt = new Date()
    if (reviewNotes) request.reviewNotes = reviewNotes

    await request.save()

    // Handle the approval based on request type
    if (request.type === "account_opening") {
        // Generate temporary password
        const tempPassword = crypto.randomBytes(12).toString("hex")
        
        // Create new user account
        const newUser = await User.create({
            firstName: request.requesterName.split(" ")[0],
            lastName: request.requesterName.split(" ").slice(1).join(" ") || "User",
            email: request.requesterEmail,
            password: tempPassword, // Temporary password
            role: request.requestedRole || "agent",
            team: request.requestedTeam || "support",
            phone: request.requesterPhone,
            jobTitle: request.jobTitle,
            requirePasswordChange: true,
        })

        // Send welcome email with temporary password
        try {
            await sendEmail({
                email: newUser.email,
                subject: "🎉 Welcome to Campus Support - Your Account is Ready!",
                message: `
Hello ${newUser.firstName},

Great news! Your Campus Support account has been approved and created successfully.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 YOUR LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 Email: ${newUser.email}
🔑 Temporary Password: ${tempPassword}

🌐 Login Portal: ${process.env.FRONTEND_URL}/login

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ IMPORTANT SECURITY NOTICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔒 For security reasons, you MUST change your password on first login.
⏰ Your temporary password will expire in 24 hours.
🚫 Do not share your login credentials with anyone.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 GETTING STARTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Click the login portal link above
2. Enter your email and temporary password
3. Follow the prompts to create a new secure password
4. Explore your dashboard and available features

If you encounter any issues or need assistance, please contact your system administrator.

Welcome to the team!

Best regards,
Campus Support Team
                `,
            })
        } catch (emailError) {
            console.error("Failed to send welcome email:", emailError)
        }
    } else if (request.type === "password_reset") {
        // Generate password reset token
        const user = await User.findById(request.existingUserId)
        if (user) {
            const resetToken = user.createPasswordResetToken()
            await user.save({ validateBeforeSave: false })

            // Send password reset email
            try {
                const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
                await sendEmail({
                    email: user.email,
                    subject: "✅ Password Reset Approved - Action Required",
                    message: `
Hello ${user.firstName || 'User'},

Good news! Your password reset request has been reviewed and approved by an administrator.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 RESET YOUR PASSWORD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Click the secure link below to create your new password:
🔗 ${resetURL}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ IMPORTANT TIMING INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ This reset link will expire in 10 minutes for security reasons.
🚀 Please use it immediately to reset your password.
🔒 After 10 minutes, you'll need to submit a new reset request.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ SECURITY NOTICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❓ Didn't request this password reset?
   • You can safely ignore this email
   • Your account remains secure
   • Consider changing your password as a precaution

📧 Questions or concerns?
   • Contact your system administrator
   • Do not reply to this automated email

Best regards,
Campus Support Team
                    `,
                })
            } catch (emailError) {
                console.error("Failed to send password reset email:", emailError)
            }
        }
    }

    // Send approval notification to requester
    try {
        const requestTypeDisplay = request.type === "account_opening" ? "Account Access" : "Password Reset"
        await sendEmail({
            email: request.requesterEmail,
            subject: `🎉 Request Approved - ${requestTypeDisplay}`,
            message: `
Hello ${request.requesterName},

Excellent news! Your ${requestTypeDisplay.toLowerCase()} request has been reviewed and approved.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ REQUEST STATUS: APPROVED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Request Type: ${requestTypeDisplay}
📧 Email: ${request.requesterEmail}
🕒 Processed: ${new Date().toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${request.type === "account_opening" 
    ? `📬 Check your email for your login credentials and welcome instructions.
🔐 You will receive a separate email with your temporary password.
🌐 Use the provided login link to access your new account.`
    : `📬 Check your email for password reset instructions.
🔗 Click the secure reset link in your email.
⏰ The reset link will expire in 10 minutes for security.`
}

${reviewNotes ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 ADMIN NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"${reviewNotes}"` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If you have any questions or need assistance, please contact your system administrator.

Best regards,
Campus Support Team
            `,
        })
    } catch (emailError) {
        console.error("Failed to send approval email:", emailError)
    }

    res.status(200).json({
        status: "success",
        message: "Request approved successfully",
        data: {
            request,
        },
    })
})

// Reject request (admin only)
export const rejectRequest = catchAsync(async (req, res, next) => {
    const { reviewNotes } = req.body

    const request = await Request.findById(req.params.id)
    if (!request) {
        return next(new AppError("Request not found", 404))
    }

    if (request.status !== "pending") {
        return next(new AppError("Request has already been processed", 400))
    }

    // Update request status
    request.status = "rejected"
    request.reviewedBy = req.user._id
    request.reviewedAt = new Date()
    if (reviewNotes) request.reviewNotes = reviewNotes

    await request.save()

    // Send rejection notification to requester
    try {
        const requestTypeDisplay = request.type === "account_opening" ? "Account Access" : "Password Reset"
        await sendEmail({
            email: request.requesterEmail,
            subject: `❌ Request Update - ${requestTypeDisplay}`,
            message: `
Hello ${request.requesterName},

We have reviewed your ${requestTypeDisplay.toLowerCase()} request and unfortunately cannot approve it at this time.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ REQUEST STATUS: NOT APPROVED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Request Type: ${requestTypeDisplay}
📧 Email: ${request.requesterEmail}
🕒 Processed: ${new Date().toLocaleString()}

${reviewNotes ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 REASON FOR DECISION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"${reviewNotes}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` : ""}
🤝 NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If you believe this decision was made in error or you have additional information to provide:

📧 Contact your system administrator
💬 Provide any additional context or documentation
🔄 You may submit a new request if circumstances change

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We appreciate your understanding and are here to help if you have any questions.

Best regards,
Campus Support Team
            `,
        })
    } catch (emailError) {
        console.error("Failed to send rejection email:", emailError)
    }

    res.status(200).json({
        status: "success",
        message: "Request rejected",
        data: {
            request,
        },
    })
})

// Delete request (admin only)
export const deleteRequest = catchAsync(async (req, res, next) => {
    const request = await Request.findByIdAndDelete(req.params.id)

    if (!request) {
        return next(new AppError("Request not found", 404))
    }

    res.status(204).json({
        status: "success",
        data: null,
    })
})

// Get request statistics (admin only)
export const getRequestStats = catchAsync(async (req, res, next) => {
    const stats = await Request.aggregate([
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
            },
        },
    ])

    const typeStats = await Request.aggregate([
        {
            $group: {
                _id: "$type",
                count: { $sum: 1 },
            },
        },
    ])

    const pendingCount = await Request.countDocuments({ status: "pending" })
    const totalCount = await Request.countDocuments()

    res.status(200).json({
        status: "success",
        data: {
            statusStats: stats,
            typeStats: typeStats,
            pendingCount,
            totalCount,
        },
    })
}) 