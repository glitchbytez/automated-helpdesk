import Ticket from "../models/Ticket.model.js"
import User from "../models/User.model.js"

import { catchAsync } from "../utils/catchAsync.js"

export const getTicketStats = catchAsync(async (req, res, next) => {
    // Get current date and yesterday for comparison
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // Format dates for comparison
    const todayStart = new Date(today.setHours(0, 0, 0, 0))
    const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0))
    
    // Get open tickets count - check for both 'Open' and uppercase/lowercase variations
    let openTickets = await Ticket.countDocuments({
        status: { $in: ["Open", "open", "OPEN", "In Progress", "in progress", "IN PROGRESS", "Pending", "pending", "PENDING"] }
    })
    
    // Double-check by directly counting tickets that are not resolved or closed
    const openTicketsAlt = await Ticket.countDocuments({
        status: { $nin: ["Resolved", "resolved", "RESOLVED", "Closed", "closed", "CLOSED"] }
    })
    
    // Use the alternative count if it's different (more reliable approach)
    if (openTicketsAlt !== openTickets) {
        openTickets = openTicketsAlt
    }
    
    // Get yesterday's open tickets for trend calculation
    const yesterdayOpenTickets = await Ticket.countDocuments({
        status: { $in: ["Open", "open", "OPEN", "In Progress", "in progress", "IN PROGRESS", "Pending", "pending", "PENDING"] },
        createdAt: { $lt: todayStart }
    })
    
    // Calculate ticket trend percentage
    let ticketTrend = 0
    if (yesterdayOpenTickets > 0) {
        ticketTrend = Math.round(((openTickets - yesterdayOpenTickets) / yesterdayOpenTickets) * 100)
    }
    
    // Get pending chat requests - check both "New" and "Chat"
    const pendingChatRequests = await Ticket.countDocuments({
        $or: [
            { status: { $in: ["New", "new", "NEW"] } },
            { source: { $in: ["chat", "Chat", "CHAT"] } }
        ]
    })
    
    // Get high priority tickets
    const highPriorityTickets = await Ticket.countDocuments({
        priority: { $in: ["High", "high", "HIGH", "Urgent", "urgent", "URGENT"] },
        status: { $nin: ["Resolved", "resolved", "RESOLVED", "Closed", "closed", "CLOSED"] }
    })
    
    // Get total tickets count
    const totalTickets = await Ticket.countDocuments({})
    
    // Get resolved tickets count
    const resolvedTickets = await Ticket.countDocuments({
        status: { $in: ["Resolved", "resolved", "RESOLVED", "Closed", "closed", "CLOSED"] }
    })
    
    res.status(200).json({
        status: "success",
        openTickets,
        ticketTrend,
        pendingChatRequests,
        highPriorityTickets,
        totalTickets,
        resolvedTickets
    })
})

export const getTicketMetrics = catchAsync(async (req, res, next) => {
    // Create a sample ticket if none exist (for testing)
    const ticketCount = await Ticket.countDocuments({})
    if (ticketCount === 0) {
        
        // Create sample tickets with different statuses and priorities
        const statuses = ['Open', 'In Progress', 'Pending', 'Resolved', 'Closed']
        const priorities = ['Low', 'Medium', 'High', 'Urgent']
        
        for (let i = 0; i < 10; i++) {
            const status = statuses[Math.floor(Math.random() * statuses.length)]
            const priority = priorities[Math.floor(Math.random() * priorities.length)]
            
            await Ticket.create({
                ticketId: `TEST-${i+1}`,
                subject: `Test Ticket ${i+1}`,
                description: `This is a test ticket ${i+1}`,
                status,
                priority,
                category: 'Technical Support',
                requester: '6460d0a7b9f0b8e2c8fcb6a1', // Replace with a valid user ID
                createdAt: new Date(),
                updatedAt: new Date()
            })
        }
    }
    
    // Use a more robust approach with $addFields to normalize case
    const statusMetrics = await Ticket.aggregate([
        {
            $match: {
                status: { $ne: null } // Exclude tickets with null status
            }
        },
        {
            $addFields: {
                normalizedStatus: {
                    $cond: [
                        { $eq: [{ $type: "$status" }, "string"] },
                        { $toUpper: "$status" }, // Convert to uppercase for case-insensitive comparison
                        "UNKNOWN"
                    ]
                }
            }
        },
        {
            $group: {
                _id: "$normalizedStatus",
                count: { $sum: 1 },
                originalStatus: { $first: "$status" } // Keep one of the original values for display
            }
        },
        {
            $sort: { count: -1 } // Sort by count in descending order
        }
    ])
    
    // Get priority metrics with similar approach
    const priorityMetrics = await Ticket.aggregate([
        {
            $match: {
                priority: { $ne: null } // Exclude tickets with null priority
            }
        },
        {
            $addFields: {
                normalizedPriority: {
                    $cond: [
                        { $eq: [{ $type: "$priority" }, "string"] },
                        { $toUpper: "$priority" }, // Convert to uppercase for case-insensitive comparison
                        "NORMAL"
                    ]
                }
            }
        },
        {
            $group: {
                _id: "$normalizedPriority",
                count: { $sum: 1 },
                originalPriority: { $first: "$priority" } // Keep one of the original values for display
            }
        },
        {
            $sort: { count: -1 } // Sort by count in descending order
        }
    ])
    
    // Format status data - use the standard case for display
    const statusData = statusMetrics.map(item => {
        // Map normalized status back to standard case for consistent display
        const standardStatus = getStandardStatusName(item.originalStatus)
        return {
            name: standardStatus,
            value: item.count,
            color: getStatusColor(standardStatus)
        }
    })
    
    // Format priority data - use the standard case for display
    const priorityData = priorityMetrics.map(item => {
        // Map normalized priority back to standard case for consistent display
        const standardPriority = getStandardPriorityName(item.originalPriority)
        return {
            name: standardPriority,
            value: item.count,
            color: getPriorityColor(standardPriority)
        }
    })
    
    // Log the data for debugging
    console.log('Ticket metrics data:', { statusData, priorityData })
    
    // Return the data in the format expected by the frontend
    res.status(200).json({
        status: "success",
        data: {
            statusData,
            priorityData
        }
    })
})

/**
 * Get response time metrics for the dashboard
 */
export const getResponseTimeMetrics = catchAsync(async (req, res, next) => {
    // Import Message model
    const Message = (await import('../models/Message.model.js')).default
    
    // Get current date and last week for comparison
    const today = new Date()
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)
    
    // Get all tickets with messages
    const tickets = await Ticket.find({
        status: { $ne: 'New' } // Only tickets that have been responded to
    }).select('_id createdAt updatedAt assignee')
    
    let totalResponseTime = 0
    let ticketsWithResponses = 0
    let previousAverageResponseTime = 0
    let currentPeriodResponseTimes = []
    let previousPeriodResponseTimes = []
    
    // Calculate response times
    for (const ticket of tickets) {
        // Find the first message from any agent
        const firstResponse = await Message.findOne({
            ticket: ticket._id,
            sender: { $ne: null } // Exclude system messages or null senders
        }).sort({ createdAt: 1 })
        
        if (firstResponse) {
            // Calculate time between ticket creation and first response (in minutes)
            const responseTime = (new Date(firstResponse.createdAt) - new Date(ticket.createdAt)) / (1000 * 60)
            
            // Add to total for average calculation
            totalResponseTime += responseTime
            ticketsWithResponses++
            
            // Separate current period (last week) and previous period
            if (new Date(firstResponse.createdAt) >= lastWeek) {
                currentPeriodResponseTimes.push(responseTime)
            } else {
                previousPeriodResponseTimes.push(responseTime)
            }
        }
    }
    
    // Calculate average response time (in minutes)
    const averageResponseTime = ticketsWithResponses > 0 
        ? Math.round(totalResponseTime / ticketsWithResponses)
        : 0
    
    // Calculate current period average
    const currentPeriodAverage = currentPeriodResponseTimes.length > 0
        ? Math.round(currentPeriodResponseTimes.reduce((sum, time) => sum + time, 0) / currentPeriodResponseTimes.length)
        : 0
    
    // Calculate previous period average
    const previousPeriodAverage = previousPeriodResponseTimes.length > 0
        ? Math.round(previousPeriodResponseTimes.reduce((sum, time) => sum + time, 0) / previousPeriodResponseTimes.length)
        : 0
    
    // Calculate response time trend
    let responseTimeTrend = 0
    if (previousPeriodAverage > 0) {
        // Negative trend is good for response time (faster responses)
        responseTimeTrend = Math.round(((currentPeriodAverage - previousPeriodAverage) / previousPeriodAverage) * -100)
    }
    
    res.status(200).json({
        status: "success",
        averageResponseTime,
        responseTimeTrend,
        currentPeriodAverage,
        previousPeriodAverage
    })
})

// Helper function to get standardized status name
function getStandardStatusName(status) {
    if (!status) return "Unknown"
    
    // Convert to string and lowercase for comparison
    const statusLower = String(status).toLowerCase()
    
    if (statusLower.includes("new")) return "New"
    if (statusLower.includes("open")) return "Open"
    if (statusLower.includes("progress")) return "In Progress"
    if (statusLower.includes("pend")) return "Pending"
    if (statusLower.includes("resolv")) return "Resolved"
    if (statusLower.includes("clos")) return "Closed"
    
    return "Other"
}

// Helper function to get standardized priority name
function getStandardPriorityName(priority) {
    if (!priority) return "Medium"
    
    // Convert to string and lowercase for comparison
    const priorityLower = String(priority).toLowerCase()
    
    if (priorityLower.includes("low")) return "Low"
    if (priorityLower.includes("med")) return "Medium"
    if (priorityLower.includes("high")) return "High"
    if (priorityLower.includes("urg") || priorityLower.includes("crit")) return "Urgent"
    
    return "Medium"
}

// Helper function to get status color
function getStatusColor(status) {
    const colors = {
        "New": "#3b82f6", // blue
        "Open": "#0ea5e9", // sky blue
        "In Progress": "#8b5cf6", // purple
        "Pending": "#f59e0b", // amber
        "Resolved": "#10b981", // green
        "Closed": "#6b7280", // gray
        "Other": "#000000", // black
        "Unknown": "#94a3b8", // slate-400
    }
    
    return colors[status] || "#000000"
}

// Helper function to get priority color
function getPriorityColor(priority) {
    const colors = {
        "Low": "#6b7280", // gray
        "Medium": "#f59e0b", // amber
        "High": "#ef4444", // red
        "Urgent": "#7f1d1d", // dark red
    }
    
    return colors[priority] || "#000000"
}

export const getTicketVolumeReport = catchAsync(async (req, res, next) => {
    // Get date range from query params
    const { startDate, endDate } = req.query

    // Default to last 7 days if not provided
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()
    
    // Calculate dates for the past 7 days
    const dates = []
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    // Create an array of the last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        dates.push({
            date: date,
            dayName: dayNames[date.getDay()],
            startOfDay: new Date(new Date(date).setHours(0, 0, 0, 0)),
            endOfDay: new Date(new Date(date).setHours(23, 59, 59, 999))
        })
    }
    
    // Prepare result array
    const volumeData = []
    
    // For each day, get new and resolved tickets
    for (const day of dates) {
        // Count new tickets created on this day
        const newTickets = await Ticket.countDocuments({
            createdAt: {
                $gte: day.startOfDay,
                $lte: day.endOfDay
            }
        })
        
        // Count tickets resolved on this day
        const resolvedTickets = await Ticket.countDocuments({
            status: { $in: ['Resolved', 'Closed'] },
            updatedAt: {
                $gte: day.startOfDay,
                $lte: day.endOfDay
            }
        })
        
        volumeData.push({
            date: day.dayName,
            new: newTickets,
            resolved: resolvedTickets
        })
    }
    
    res.status(200).json({
        status: "success",
        data: volumeData
    })
})

export const getResponseTimeReport = catchAsync(async (req, res, next) => {
    // Get date range from query params
    const { startDate, endDate } = req.query

    // Default to last 30 days if not provided
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()
    
    // Get previous period for comparison
    const previousPeriodStart = new Date(start)
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 30)
    const previousPeriodEnd = new Date(end)
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 30)

    // Get average response time by day
    const responseTime = await Ticket.aggregate([
        {
            $match: {
                createdAt: { $gte: start, $lte: end },
                responseTime: { $exists: true, $ne: null },
            },
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                avgResponseTime: { $avg: "$responseTime" },
                count: { $sum: 1 },
            },
        },
        {
            $sort: { _id: 1 },
        },
    ])
    
    // Calculate overall average response time for current period
    const currentPeriodAvg = await Ticket.aggregate([
        {
            $match: {
                createdAt: { $gte: start, $lte: end },
                responseTime: { $exists: true, $ne: null },
            },
        },
        {
            $group: {
                _id: null,
                averageResponseTime: { $avg: "$responseTime" },
                count: { $sum: 1 },
            },
        },
    ])
    
    // Calculate overall average response time for previous period
    const previousPeriodAvg = await Ticket.aggregate([
        {
            $match: {
                createdAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd },
                responseTime: { $exists: true, $ne: null },
            },
        },
        {
            $group: {
                _id: null,
                averageResponseTime: { $avg: "$responseTime" },
                count: { $sum: 1 },
            },
        },
    ])
    
    // Calculate trend (difference from previous period)
    const averageResponseTime = currentPeriodAvg.length > 0 ? Math.round(currentPeriodAvg[0].averageResponseTime) : 0
    const previousAvgResponseTime = previousPeriodAvg.length > 0 ? Math.round(previousPeriodAvg[0].averageResponseTime) : 0
    const responseTimeTrend = previousAvgResponseTime > 0 ? averageResponseTime - previousAvgResponseTime : 0

    res.status(200).json({
        status: "success",
        data: {
            responseTime,
            averageResponseTime,
            responseTimeTrend,
            previousPeriodAverage: previousAvgResponseTime
        },
    })
})

export const getAgentPerformanceReport = catchAsync(async (req, res, next) => {
    // Get date range from query params
    const { startDate, endDate } = req.query

    // Default to last 30 days if not provided
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()

    // Get tickets assigned to each agent
    const agentTickets = await Ticket.aggregate([
        {
            $match: {
                assignee: { $exists: true, $ne: null },
                createdAt: { $gte: start, $lte: end },
            },
        },
        {
            $group: {
                _id: "$assignee",
                totalTickets: { $sum: 1 },
                resolvedTickets: {
                    $sum: {
                        $cond: [{ $in: ["$status", ["Resolved", "Closed"]] }, 1, 0],
                    },
                },
                avgResponseTime: { $avg: "$responseTime" },
            },
        },
    ])

    // Get agent details
    const agentIds = agentTickets.map((agent) => agent._id)
    const agents = await User.find({ _id: { $in: agentIds } }, "firstName lastName email avatar")

    // Combine the results
    const result = agentTickets.map((agent) => {
        const agentDetails = agents.find((a) => a._id.toString() === agent._id.toString())
        return {
            agent: agentDetails,
            totalTickets: agent.totalTickets,
            resolvedTickets: agent.resolvedTickets,
            resolutionRate: (agent.resolvedTickets / agent.totalTickets) * 100,
            avgResponseTime: agent.avgResponseTime,
        }
    })

    res.status(200).json({
        status: "success",
        data: {
            agentPerformance: result,
        },
    })
})

export const getSatisfactionReport = catchAsync(async (req, res, next) => {
    // This would require a satisfaction rating model
    // For now, we'll return a placeholder

    res.status(200).json({
        status: "success",
        data: {
            satisfactionReport: {
                averageRating: 4.5,
                totalRatings: 120,
                ratingDistribution: {
                    5: 80,
                    4: 30,
                    3: 5,
                    2: 3,
                    1: 2,
                },
            },
        },
    })
})

export const getMonthlyTicketReport = catchAsync(async (req, res, next) => {
    const { year, month } = req.params
    
    // Convert to numbers and validate
    const numYear = parseInt(year, 10)
    const numMonth = parseInt(month, 10)
    
    if (isNaN(numYear) || isNaN(numMonth) || numMonth < 0 || numMonth > 11) {
        return res.status(400).json({
            status: "fail",
            message: "Invalid year or month parameters"
        })
    }
    
    // Create date range for the specified month
    const startDate = new Date(numYear, numMonth, 1)
    const endDate = new Date(numYear, numMonth + 1, 0) // Last day of the month
    endDate.setHours(23, 59, 59, 999) // Set to end of day
    
    // Get daily ticket stats for the month
    const dailyStats = await Ticket.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: { $dayOfMonth: "$createdAt" },
                created: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ])
    
    // Get resolved tickets by day
    const resolvedTickets = await Ticket.aggregate([
        {
            $match: {
                status: { $in: ["Resolved", "Closed"] },
                updatedAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: { $dayOfMonth: "$updatedAt" },
                resolved: { $sum: 1 }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ])
    
    // Combine the results
    const daysInMonth = new Date(numYear, numMonth + 1, 0).getDate()
    const result = []
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayStats = dailyStats.find(d => d._id === day)
        const dayResolved = resolvedTickets.find(d => d._id === day)
        
        const created = dayStats ? dayStats.created : 0
        const resolved = dayResolved ? dayResolved.resolved : 0
        
        result.push({
            day,
            created,
            resolved,
            pending: created - resolved
        })
    }
    
    // Get tickets for the month for the table view
    const tickets = await Ticket.find({
        createdAt: { $gte: startDate, $lte: endDate }
    })
    .populate('assignee', 'firstName lastName')
    .populate('requester', 'firstName lastName email')
    .sort('-createdAt')
    .limit(100) // Limit to 100 tickets for performance
    
    res.status(200).json({
        status: "success",
        data: {
            dailyStats: result,
            tickets,
            summary: {
                totalCreated: dailyStats.reduce((sum, day) => sum + day.created, 0),
                totalResolved: resolvedTickets.reduce((sum, day) => sum + day.resolved, 0),
                year: numYear,
                month: numMonth
            }
        }
    })
})


