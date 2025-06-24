import Notification from "../models/notification.model.js"
import { catchAsync } from "../utils/catchAsync.js"
import { AppError } from "../utils/appError.js"

/**
 * Get all notifications for the current user
 */
export const getNotifications = catchAsync(async (req, res, next) => {
  const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 })

  res.status(200).json({
    status: "success",
    results: notifications.length,
    notifications,
  })
})

/**
 * Mark a notification as read
 */
export const markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { read: true },
    { new: true, runValidators: true }
  )

  if (!notification) {
    return next(new AppError("No notification found with that ID", 404))
  }

  res.status(200).json({
    status: "success",
    notification,
  })
})

/**
 * Mark all notifications as read
 */
export const markAllAsRead = catchAsync(async (req, res, next) => {
  await Notification.updateMany({ user: req.user.id }, { read: true })

  res.status(200).json({
    status: "success",
    message: "All notifications marked as read",
  })
})

/**
 * Delete a notification
 */
export const deleteNotification = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  })

  if (!notification) {
    return next(new AppError("No notification found with that ID", 404))
  }

  res.status(204).json({
    status: "success",
    data: null,
  })
})

/**
 * Create a notification (for internal use)
 */
export const createNotification = async (userId, title, message, options = {}) => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type: options.type || "info",
      relatedTo: options.relatedTo || "system",
      relatedId: options.relatedId || null,
    })
    
    return notification
  } catch (error) {
    console.error("Error creating notification:", error)
    return null
  }
}
