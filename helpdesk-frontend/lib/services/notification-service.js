import { api } from "../api"

/**
 * Notification service for handling notification operations
 */
export const notificationService = {
  /**
   * Get all notifications for the current user
   * @returns {Promise<Object>} Notifications data
   */
  async getNotifications() {
    return api.get("notifications")
  },

  /**
   * Mark a notification as read
   * @param {string} id - Notification ID
   * @returns {Promise<Object>} Updated notification
   */
  async markAsRead(id) {
    return api.patch(`notifications/${id}/read`)
  },

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} Response data
   */
  async markAllAsRead() {
    return api.patch("notifications/read-all")
  },

  /**
   * Delete a notification
   * @param {string} id - Notification ID
   * @returns {Promise<Object>} Response data
   */
  async deleteNotification(id) {
    return api.delete(`notifications/${id}`)
  },
}
