import { catchAsync } from "../utils/catchAsync.js"
import { AppError } from "../utils/appError.js"
import Feedback from "../models/Feedback.model.js"
import ChatSession from "../models/ChatSession.model.js"

/**
 * Submit feedback from chatbot users
 */
export const submitFeedback = catchAsync(async (req, res, next) => {
    const feedbackData = req.body;
    
    // Validate required fields
    if (!feedbackData.sessionId) {
        return next(new AppError("Session ID is required", 400));
    }
    
    if (feedbackData.rating === undefined || feedbackData.rating === null) {
        return next(new AppError("Rating is required", 400));
    }
    
    if (feedbackData.satisfied === undefined || feedbackData.satisfied === null) {
        return next(new AppError("Satisfaction status is required", 400));
    }
    
    // Try to find the associated session
    let sessionRef = null;
    try {
        const session = await ChatSession.findOne({ sessionId: feedbackData.sessionId });
        if (session) {
            sessionRef = session._id;
        }
    } catch (error) {
        // If session not found, continue without the reference
        console.log(`Session not found for ID: ${feedbackData.sessionId}`, error.message);
    }
    
    // Create feedback with session reference if available
    const feedback = await Feedback.create({
        ...feedbackData,
        session: sessionRef
    });
    
    res.status(201).json({
        status: "success",
        data: {
            feedback
        }
    });
});

/**
 * Get all feedback
 */
export const getAllFeedback = catchAsync(async (req, res, next) => {
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    
    res.status(200).json({
        status: "success",
        results: feedback.length,
        data: {
            feedback
        }
    });
});

/**
 * Get feedback by ID
 */
export const getFeedbackById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    
    const feedback = await Feedback.findById(id);
    
    if (!feedback) {
        return next(new AppError("Feedback not found", 404));
    }
    
    res.status(200).json({
        status: "success",
        data: {
            feedback
        }
    });
});

/**
 * Get feedback by session ID
 */
export const getFeedbackBySessionId = catchAsync(async (req, res, next) => {
    const { sessionId } = req.params;
    
    const feedback = await Feedback.find({ sessionId }).sort({ createdAt: -1 });
    
    res.status(200).json({
        status: "success",
        results: feedback.length,
        data: {
            feedback
        }
    });
});

/**
 * Get feedback statistics
 */
export const getFeedbackStats = catchAsync(async (req, res, next) => {
    const stats = await Feedback.aggregate([
        {
            $group: {
                _id: null,
                totalCount: { $sum: 1 },
                averageRating: { $avg: "$rating" },
                satisfiedCount: { 
                    $sum: { $cond: [{ $eq: ["$satisfied", true] }, 1, 0] }
                },
                unsatisfiedCount: { 
                    $sum: { $cond: [{ $eq: ["$satisfied", false] }, 1, 0] }
                }
            }
        },
        {
            $project: {
                _id: 0,
                totalCount: 1,
                averageRating: { $round: ["$averageRating", 2] },
                satisfiedCount: 1,
                unsatisfiedCount: 1,
                satisfactionRate: { 
                    $round: [
                        { $multiply: [
                            { $divide: ["$satisfiedCount", { $max: ["$totalCount", 1] }] }, 
                            100
                        ] }, 
                        2
                    ] 
                }
            }
        }
    ]);
    
    res.status(200).json({
        status: "success",
        data: {
            stats: stats.length > 0 ? stats[0] : {
                totalCount: 0,
                averageRating: 0,
                satisfiedCount: 0,
                unsatisfiedCount: 0,
                satisfactionRate: 0
            }
        }
    });
});
