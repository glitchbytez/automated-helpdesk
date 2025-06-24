import jwt from "jsonwebtoken"
import crypto from "crypto"
import User from "../models/User.model.js"
import { catchAsync } from "../utils/catchAsync.js"
import { AppError } from "../utils/appError.js"
import { sendEmail, sendPasswordResetEmail } from "../utils/email.js"
import { JWT_COOKIE_EXPIRES_IN, JWT_EXPIRES_IN, JWT_SECRET, NODE_ENV, REFRESH_TOKEN_SECRET } from "../config/env.js"

const signToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    })
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)
    const cookieOptions = {
        expires: new Date(Date.now() + (Number(JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000)),
        httpOnly: true,
    }

    if (NODE_ENV === "production") cookieOptions.secure = true

    res.cookie("jwt", token, cookieOptions)

    // Remove password from output
    user.password = undefined

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user,
        },
    })
}

export const register = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role || "agent",
        team: req.body.team || "support",
        permissions: req.body.permissions || ["viewTickets", "createTickets"],
    })

    createSendToken(newUser, 201, res)
})

export const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body

    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new AppError("Please provide email and password!", 400))
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select("+password")

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError("Incorrect email or password", 401))
    }

    // 3) Update last active
    user.lastActive = Date.now()
    await user.save({ validateBeforeSave: false })

    // 4) If everything ok, send token to client
    createSendToken(user, 200, res)
})

export const logout = (req, res) => {
    res.cookie("jwt", "loggedout", {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    })
    res.status(200).json({ status: "success" })
}

export const refreshToken = catchAsync(async (req, res, next) => {
    // 1) Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken

    if (!refreshToken) {
        return next(new AppError("No refresh token found", 401))
    }

    // 2) Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET)

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
        return next(new AppError("The user belonging to this token no longer exists.", 401))
    }

    // 4) Create new access token
    const token = signToken(currentUser._id)

    res.status(200).json({
        status: "success",
        token,
    })
})

export const forgotPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return next(new AppError("There is no user with that email address.", 404))
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false })

    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get("host")}/api/auth/reset-password/${resetToken}`

    const message = `Forgot your password? Submit a PATCH request with your new password to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`

    try {
        await sendEmail({
            email: user.email,
            subject: "Your password reset token (valid for 10 min)",
            message,
            html: `<p>Forgot your password?</p><p>Click <a href="${resetURL}">here</a> to reset your password.</p><p>If you didn't forget your password, please ignore this email!</p>`,
        })

        res.status(200).json({
            status: "success",
            message: "Token sent to email!",
        })
    } catch (err) {
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({ validateBeforeSave: false })

        return next(new AppError("There was an error sending the email. Try again later!", 500))
    }
})

export const resetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on the token
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex")

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    })

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
        return next(new AppError("Token is invalid or has expired", 400))
    }

    user.password = req.body.password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    // 3) Update changedPasswordAt property for the user
    // This is handled by a pre-save middleware in the User model

    // Send password reset confirmation email
    try {
        await sendPasswordResetEmail(user, null, false) // false indicates user-initiated reset
    } catch (err) {
        console.error("Error sending password reset confirmation email:", err)
        // Continue even if email fails - don't block the password reset
    }

    // 4) Log the user in, send JWT
    createSendToken(user, 200, res)
})

export const updatePassword = catchAsync(async (req, res, next) => {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select("+password")

    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
        return next(new AppError("Your current password is wrong.", 401))
    }

    // 3) If so, update password
    user.password = req.body.newPassword
    await user.save()

    // 4) Log user in, send JWT
    createSendToken(user, 200, res)
})
