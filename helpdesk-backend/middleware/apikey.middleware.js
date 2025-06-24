import { AppError } from "../utils/appError.js"
import { catchAsync } from "../utils/catchAsync.js"
import { API_KEY_SECRET } from "../config/env.js"

/**
 * Middleware to authenticate requests using API key
 * This allows internal services like the chatbot server to access protected endpoints
 * without requiring user authentication
 */
export const authenticateApiKey = catchAsync(async (req, res, next) => {
    // 1) Get API key from header
    const apiKey = req.headers["x-api-key"]

    if (!apiKey) {
        return next()  // No API key provided, continue to next auth middleware
    }

    // 2) Verify API key
    if (apiKey !== API_KEY_SECRET) {
        return next(new AppError("Invalid API key", 401))
    }

    // 3) Add a flag to the request to indicate it was authenticated via API key
    req.isApiAuthenticated = true
    
    // GRANT ACCESS TO PROTECTED ROUTE
    next()
})
