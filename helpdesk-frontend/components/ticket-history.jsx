import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ticketService } from "@/lib/services/ticket-service"
import { toast } from "sonner"

export function TicketHistory({ ticketId }) {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadHistory = async () => {
      if (!ticketId) return
      
      try {
        setIsLoading(true)
        const response = await ticketService.getTicketHistory(ticketId)
        
        if (response.data && response.data.history) {
          // Format history items for display
          const formattedHistory = response.data.history.map((item, index) => ({
            id: index + 1,
            action: item.action,
            actor: {
              name: item.actor ? `${item.actor.firstName} ${item.actor.lastName}` : "System",
              avatar: item.actor ? item.actor.avatar : "",
            },
            // Use createdAt instead of timestamp since that's what the model provides
            timestamp: item.createdAt,
          }))
          setHistory(formattedHistory)
        }
      } catch (error) {
        console.error("Error loading ticket history:", error)
        toast({
          title: "Error",
          description: "Failed to load ticket history. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [ticketId])

  return (
    <div className="h-full overflow-y-auto p-4">
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No history available
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border"></div>
          <ul className="space-y-4">
            {history.map((item) => (
              <li key={item.id} className="relative pl-9">
                <div className="absolute left-0 top-2 h-8 w-8 rounded-full border bg-background flex items-center justify-center">
                  {item.actor.avatar ? (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={item.actor.avatar} alt={item.actor.name} />
                      <AvatarFallback>{getInitials(item.actor.name)}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-primary"></div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{item.action}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{item.actor.name}</span>
                    <span>•</span>
                    <span>{formatDate(item.timestamp)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

function formatDate(dateString) {
  // Handle invalid date values
  if (!dateString) return 'Unknown date';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}
