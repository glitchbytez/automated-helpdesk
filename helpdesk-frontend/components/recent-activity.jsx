import { MessageSquare, Ticket, User, FileText } from "lucide-react"

export function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: "ticket",
      title: "New ticket created",
      description: "Sarah Johnson created ticket #1234",
      time: "2 minutes ago",
      icon: Ticket,
    },
    {
      id: 2,
      type: "chat",
      title: "Chat message received",
      description: "Michael Brown sent a message in ticket #1089",
      time: "10 minutes ago",
      icon: MessageSquare,
    },
    {
      id: 3,
      type: "assignment",
      title: "Ticket assigned",
      description: "Ticket #1234 assigned to John Doe",
      time: "15 minutes ago",
      icon: User,
    },
    {
      id: 4,
      type: "knowledge",
      title: "Knowledge base article updated",
      description: "Article 'Password Reset Guide' was updated",
      time: "1 hour ago",
      icon: FileText,
    },
    {
      id: 5,
      type: "ticket",
      title: "Ticket resolved",
      description: "John Doe resolved ticket #1089",
      time: "2 hours ago",
      icon: Ticket,
    },
  ]

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-4">
          <div className={`rounded-full p-2 ${getActivityColor(activity.type)}`}>
            <activity.icon className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
            <p className="text-xs text-gray-500">{activity.description}</p>
            <p className="text-xs text-gray-400">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function getActivityColor(type) {
  switch (type) {
    case "ticket":
      return "bg-blue-100 text-blue-600"
    case "chat":
      return "bg-green-100 text-green-600"
    case "assignment":
      return "bg-purple-100 text-purple-600"
    case "knowledge":
      return "bg-amber-100 text-amber-600"
    default:
      return "bg-gray-100 text-gray-600"
  }
}

