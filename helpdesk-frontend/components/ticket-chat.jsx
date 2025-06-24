"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PaperclipIcon, SendIcon, Mail, AlertCircle } from "lucide-react"
import { ticketService } from "@/lib/services/ticket-service"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

export function TicketChat({ ticketId, ticket }) {
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState([])

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load email conversation data when component mounts
  useEffect(() => {
    const loadEmailConversation = async () => {
      if (!ticketId) return
      
      try {
        setIsLoading(true)
        const response = await ticketService.getTicketMessages(ticketId)
        
        if (response && response.data && response.data.messages) {
          // Format messages for display
          const formattedMessages = response.data.messages.map(msg => ({
            id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sender: {
              name: msg.fromAgent ? 'Support Agent' : (ticket?.customer?.name || 'Customer'),
              avatar: msg.fromAgent ? '/images/agent-avatar.png' : '/images/user-avatar.png',
              isAgent: msg.fromAgent,
            },
            content: msg.content,
            subject: msg.subject,
            timestamp: new Date(msg.createdAt).toLocaleString(),
            read: true
          }))
          
          setMessages(formattedMessages)
        }
      } catch (error) {
        console.error("Error loading ticket messages:", error)
        // Don't show error for new tickets without messages
        if (error.response && error.response.status !== 404) {
          toast.error("Failed to load conversation history")
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (ticketId) {
      loadEmailConversation()
    }
  }, [ticketId, ticket])

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (!message.trim() || !ticketId) return

    try {
      setIsSending(true)
      
      // Automatically generate a subject line based on the ticket subject
      const emailSubject = ticket?.subject ? `Re: ${ticket.subject}` : 'Re: Your Support Ticket'
      
      // Create email message data
      const emailData = {
        ticketId,
        subject: emailSubject,
        message: message.trim(),
        recipientEmail: ticket?.customer?.email || ticket?.userEmail || 'customer@example.com'
      }
      
      // Optimistically update UI
      const tempMessage = {
        id: `temp-${Date.now()}`,
        sender: {
          name: "Support Agent",
          avatar: "/images/agent-avatar.png",
          isAgent: true
        },
        content: message.trim(),
        timestamp: new Date().toLocaleString(),
        read: true
      }

      setMessages([...messages, tempMessage])
      setMessage("")

      // Send message via API
      const response = await ticketService.sendTicketMessage(emailData)
      
      if (response && response.data && response.data.message) {
        // Replace temp message with actual message from server
        const newMessages = [...messages]
        const tempIndex = newMessages.findIndex(msg => msg.id === tempMessage.id)
        
        if (tempIndex !== -1) {
          newMessages[tempIndex] = {
            id: response.data.message.id,
            sender: {
              name: "Support Agent",
              avatar: "/images/agent-avatar.png",
              isAgent: true
            },
            content: response.data.message.content,
            timestamp: new Date(response.data.message.createdAt).toLocaleString(),
            read: true
          }
          setMessages(newMessages)
        }
        
        toast.success("Message sent successfully")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message. Please try again.")
      
      // Remove the temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-16">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full space-y-2">
            <p className="text-muted-foreground">No messages found for this ticket</p>
            <div className="text-center max-w-md">
              <p className="text-sm text-muted-foreground mb-2">
                Send a message to communicate with the customer about this ticket.
              </p>
              <p className="text-sm text-muted-foreground">
                All messages will be delivered to the customer's email address.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${!msg.sender.isAgent ? "justify-start" : "justify-end"}`}
            >
              <div className={`flex max-w-[80%] ${!msg.sender.isAgent ? "flex-row" : "flex-row-reverse"}`}>
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage src={msg.sender.avatar || ""} alt={msg.sender.name} />
                  <AvatarFallback>{getInitials(msg.sender.name)}</AvatarFallback>
                </Avatar>
                <div
                  className={`mx-2 px-4 py-2 rounded-lg ${
                    !msg.sender.isAgent ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
                  }`}
                >
                  <div className="text-sm font-medium mb-1">{msg.sender.name}</div>
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  <div className="text-xs mt-1 opacity-70">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            </div>
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {ticket && ticket.status === "Closed" ? (
        <div className="flex items-center justify-center p-4 border-t bg-gray-50">
          <p className="text-sm text-muted-foreground">This ticket is closed. You cannot send new messages.</p>
        </div>
      ) : (
        <form onSubmit={handleSendMessage} className="flex items-end gap-2 p-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            size="icon" 
            className="h-10 w-10 shrink-0"
            disabled={isLoading || isSending}
          >
            <PaperclipIcon className="h-5 w-5" />
            <span className="sr-only">Attach file</span>
          </Button>
          
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="h-20 max-h-20 flex-1 resize-none overflow-auto"
            disabled={isLoading || isSending || (ticket && ticket.status === "Closed")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage(e)
              }
            }}
          />
          
          <Button 
            type="submit" 
            size="icon" 
            className="h-10 w-10 shrink-0"
            disabled={isLoading || isSending || !message.trim() || (ticket && ticket.status === "Closed")}
          >
          {isSending ? (
            <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
          ) : (
            <SendIcon className="h-5 w-5" />
          )}
          <span className="sr-only">Send message</span>
          </Button>
        </form>
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

function formatTime(dateString) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
  }).format(date)
}
