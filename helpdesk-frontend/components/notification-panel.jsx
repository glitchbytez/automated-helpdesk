"use client"

import { useState, useEffect } from "react"
import { Bell, MessageSquare, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { notificationService } from "@/lib/services/notification-service"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

export function NotificationPanel() {
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true)
        const response = await notificationService.getNotifications()
        
        if (response.data && response.data.notifications) {
          // Format notifications for display
          const formattedNotifications = response.data.notifications.map(notification => {
            // Determine icon based on notification type
            let icon;
            if (notification.type === "chat") {
              icon = MessageSquare;
            } else if (notification.type === "ticket") {
              icon = Ticket;
            } else {
              icon = Bell;
            }
            
            return {
              id: notification._id,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              time: formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }),
              read: notification.read,
              icon: icon,
            };
          });
          
          setNotifications(formattedNotifications)
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
        toast.error("Failed to load notifications. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchNotifications()
  }, [])

  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      
      // Update local state
      setNotifications(notifications.map(notification => ({
        ...notification,
        read: true
      })))
      
      toast.success("All notifications marked as read")
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast.error("Failed to mark notifications as read. Please try again.")
    }
  }

  // Handle marking a single notification as read
  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id)
      
      // Update local state
      setNotifications(notifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      ))
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error)
    }
  }

  return (
    <div className="w-full bg-white border border-gray-200 shadow-lg rounded-md overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-gray-700 hover:text-gray-900"
          onClick={handleMarkAllAsRead}
          disabled={isLoading || notifications.length === 0 || notifications.every(n => n.read)}
        >
          Mark all as read
        </Button>
      </div>
      <div className="max-h-96 overflow-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4">
            <Bell className="mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-500">No new notifications</p>
          </div>
        ) : (
          <div className="space-y-0">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 ${
                  notification.read ? 'bg-gray-50' : ''
                }`}
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    notification.type === "chat" ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"
                  }`}
                >
                  <notification.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{notification.message}</p>
                  <p className="text-xs text-gray-400">{notification.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
