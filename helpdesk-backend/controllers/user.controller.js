import User from "../models/User.model.js"
import { catchAsync } from "../utils/catchAsync.js"
import { AppError } from "../utils/appError.js"
import { sendEmail, sendUserCreatedEmail, sendPasswordResetEmail } from "../utils/email.js"

// Helper function to filter object
const filterObj = (obj, ...allowedFields) => {
    const newObj = {}
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el]
    })
    return newObj
}

export const getMe = (req, res, next) => {
    req.params.id = req.user.id
    next()
}

export const updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user POSTs password data
    if (req.body.password) {
        return next(new AppError("This route is not for password updates. Please use /update-password.", 400))
    }

    // 2) Filter out unwanted fields that are not allowed to be updated
    const filteredBody = filterObj(
        req.body,
        "firstName",
        "lastName",
        "email",
        "phone",
        "jobTitle",
        "bio",
        "avatar",
        "notificationPreferences",
    )

    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
        new: true,
        runValidators: true,
    })

    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser,
        },
    })
})

export const getAllUsers = catchAsync(async (req, res, next) => {
    // Import Ticket model at the top of the file
    const Ticket = (await import('../models/Ticket.model.js')).default
    
    // Get all users
    const users = await User.find()
    
    // Get ticket counts for each user
    const userIds = users.map(user => user._id)
    
    // Aggregate to count tickets assigned to each user
    const ticketCounts = await Ticket.aggregate([
        { $match: { assignee: { $in: userIds } } },
        { $group: { _id: '$assignee', count: { $sum: 1 } } }
    ])
    
    // Create a map of user ID to ticket count
    const ticketCountMap = {}
    ticketCounts.forEach(item => {
        ticketCountMap[item._id.toString()] = item.count
    })
    
    // Add ticket count to each user
    const usersWithTicketCounts = users.map(user => {
        const userObj = user.toObject()
        userObj.assignedTickets = ticketCountMap[user._id.toString()] || 0
        return userObj
    })

    res.status(200).json({
        status: "success",
        results: users.length,
        data: {
            users: usersWithTicketCounts,
        },
    })
})

export const getUser = catchAsync(async (req, res, next) => {
    // Import required models
    const Ticket = (await import('../models/Ticket.model.js')).default
    const Message = (await import('../models/Message.model.js')).default
    
    // Find the user
    const user = await User.findById(req.params.id)

    if (!user) {
        return next(new AppError("No user found with that ID", 404))
    }
    
    // Convert user to object for adding additional fields
    const userObj = user.toObject()
    
    // Calculate performance metrics
    try {
        // 1. Count assigned tickets
        const assignedTicketsCount = await Ticket.countDocuments({ assignee: user._id })
        userObj.assignedTicketsCount = assignedTicketsCount
        
        // 2. Count resolved tickets
        const resolvedTicketsCount = await Ticket.countDocuments({ 
            assignee: user._id,
            status: 'Closed'
        })
        userObj.resolvedTicketsCount = resolvedTicketsCount
        
        // 3. Calculate average response time (in hours)
        // This is a simplified calculation - in a real system you'd have more detailed metrics
        const ticketsWithMessages = await Ticket.find({
            assignee: user._id,
            status: { $ne: 'New' } // Only tickets that have been responded to
        }).select('_id createdAt updatedAt')
        
        let totalResponseTime = 0
        let ticketsWithResponses = 0
        
        for (const ticket of ticketsWithMessages) {
            // Find the first response from this agent
            const firstResponse = await Message.findOne({
                ticket: ticket._id,
                sender: user._id
            }).sort({ createdAt: 1 })
            
            if (firstResponse) {
                // Calculate time between ticket creation and first response (in hours)
                const responseTime = (new Date(firstResponse.createdAt) - new Date(ticket.createdAt)) / (1000 * 60 * 60)
                totalResponseTime += responseTime
                ticketsWithResponses++
            }
        }
        
        // Calculate average response time (default to 0 if no responses)
        userObj.averageResponseTime = ticketsWithResponses > 0 
            ? parseFloat((totalResponseTime / ticketsWithResponses).toFixed(1))
            : 0
        
        // 4. Calculate customer satisfaction (mock data - would come from ratings in a real system)
        // For now, generate a reasonable score based on resolved tickets and response time
        const resolutionRate = assignedTicketsCount > 0 ? resolvedTicketsCount / assignedTicketsCount : 0
        const responseScore = userObj.averageResponseTime < 4 ? 1 : userObj.averageResponseTime < 8 ? 0.7 : 0.4
        
        // Calculate satisfaction score (1-5 scale)
        userObj.customerSatisfaction = parseFloat((3 + resolutionRate + responseScore).toFixed(1))
        if (userObj.customerSatisfaction > 5) userObj.customerSatisfaction = 5
        
        // 5. Count active chats
        // In a real system, this would come from active chat sessions
        // For now, we'll estimate based on open tickets
        userObj.activeChats = await Ticket.countDocuments({
            assignee: user._id,
            status: { $in: ['Open', 'In Progress'] }
        })
    } catch (err) {
        console.error('Error calculating performance metrics:', err)
        // Don't fail the request if metrics calculation fails
    }

    res.status(200).json({
        status: "success",
        data: {
            user: userObj,
        },
    })
})

export const createUser = catchAsync(async (req, res, next) => {
    // Use the provided password or generate a random one if not provided
    const password = req.body.password || Math.random().toString(36).slice(-8)
    const requirePasswordChange = req.body.requirePasswordChange !== undefined ? req.body.requirePasswordChange : true

    const newUser = await User.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password,
        role: req.body.role,
        team: req.body.team,
        permissions: req.body.permissions,
        requirePasswordChange,
    })

    // Send user creation email with account details
    try {
        await sendUserCreatedEmail(newUser, password)
    } catch (err) {
        console.error("Error sending user creation email:", err)
    }

    // Remove password from output
    newUser.password = undefined

    res.status(201).json({
        status: "success",
        data: {
            user: newUser,
        },
    })
})

export const updateUser = catchAsync(async (req, res, next) => {
    // Filter out password field
    const filteredBody = { ...req.body }
    delete filteredBody.password

    const updatedUser = await User.findByIdAndUpdate(req.params.id, filteredBody, {
        new: true,
        runValidators: true,
    })

    if (!updatedUser) {
        return next(new AppError("No user found with that ID", 404))
    }

    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser,
        },
    })
})

export const deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id)

    if (!user) {
        return next(new AppError("No user found with that ID", 404))
    }

    res.status(204).json({
        status: "success",
        data: null,
    })
})

export const adminResetPassword = catchAsync(async (req, res, next) => {
    const { password, requirePasswordChange = true } = req.body

    // Check if password is provided
    if (!password) {
        return next(new AppError("Please provide a password", 400))
    }

    const user = await User.findById(req.params.id).select("+password")

    if (!user) {
        return next(new AppError("No user found with that ID", 404))
    }

    // Update password and set requirePasswordChange flag
    user.password = password
    user.requirePasswordChange = requirePasswordChange
    user.passwordChangedAt = Date.now() - 1000 // Subtract 1 second to ensure the token is valid
    await user.save()

    // Send password reset notification email
    try {
        await sendPasswordResetEmail(user, password, true) // true indicates admin reset
    } catch (err) {
        console.error("Error sending password reset email:", err)
        // Continue even if email fails - don't block the password reset
    }

    res.status(200).json({
        status: "success",
        message: "Password reset successfully",
    })
})

export const updateUserStatus = catchAsync(async (req, res, next) => {
    const { status } = req.body

    if (!["active", "inactive", "away"].includes(status)) {
        return next(new AppError("Invalid status", 400))
    }

    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true })

    if (!user) {
        return next(new AppError("No user found with that ID", 404))
    }

    res.status(200).json({
        status: "success",
        data: {
            user,
        },
    })
})

/**
 * Update current user's password
 * @route PATCH /users/update-password
 */
export const updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get the user from the collection
    const user = await User.findById(req.user.id).select("+password")

    // 2) Check if the current password is correct
    if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
        return next(new AppError("Your current password is incorrect", 401))
    }

    // 3) Update the password
    user.password = req.body.newPassword
    user.requirePasswordChange = false // Set requirePasswordChange to false
    await user.save() // This will trigger the pre-save middleware to hash the password

    // 4) Log the user in, send JWT
    res.status(200).json({
        status: "success",
        message: "Password updated successfully"
    })
})
