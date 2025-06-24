"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MoreVertical, Phone, Video, Paperclip, Send, Check, CheckCheck, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { socketService } from "@/lib/services/socket-service"
import { chatService } from "@/lib/services/chat-service"
import { ticketService } from "@/lib/services/ticket-service"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

export default function ChatsPage() {
  const { user, loading: authLoading } = useAuth()
  const [activeChat, setActiveChat] = useState(null)
  const [conversations, setConversations] = useState([])
  const [chatRequests, setChatRequests] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [activeTab, setActiveTab] = useState("active")
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [socket, setSocket] = useState(null)
  const [assignedChats, setAssignedChats] = useState({})
  const [joiningChat, setJoiningChat] = useState(false)
  const [createTicketDialogOpen, setCreateTicketDialogOpen] = useState(false)
  const [isCreatingTicket, setIsCreatingTicket] = useState(false)
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    priority: "Medium",
    category: "General",
    channel: "Chat",
    sessionId: ""
  })
  
  // Format time in 12-hour format
  const formatTime = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date)
  }

  // Get status color based on user status
  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "away":
        return "bg-yellow-500"
      case "offline":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return ""
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // Initialize socket connection and fetch data
  useEffect(() => {
    const initSocket = async () => {
      try {
        setIsLoading(true)
        
        // Check if chat server is available by trying to access the preload endpoint
        // This is the same endpoint used by getChatSessions
        let isChatServerAvailable = false
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
          
          const serverCheck = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:5501'}/preload`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
          })
          
          clearTimeout(timeoutId)
          isChatServerAvailable = serverCheck.ok
          console.log("Chat server is available:", isChatServerAvailable)
        } catch (error) {
          console.warn("Chat server check failed:", error.message)
          isChatServerAvailable = false
        }
        
        if (!isChatServerAvailable) {
          console.warn("Chat server is not available, running in offline mode")
          toast.warning("Chat server is not available", {
            description: "The application will run in offline mode with limited functionality."
          })
        }
        
        // Initialize socket connection
        const socketInstance = socketService.initialize()
        setSocket(socketInstance)
        
        // Register as admin if socket is connected
        if (socketInstance && (socketInstance.connected || isChatServerAvailable)) {
          if (user) {
            const adminSessionId = socketService.registerAsAdmin(user.id)
            // Store the admin session ID for reference
            localStorage.setItem('adminSessionId', adminSessionId)
          } else {
            // Use a temporary ID if user is not available
            const tempAgentId = localStorage.getItem('tempAgentId') || `agent-${Date.now()}`
            localStorage.setItem('tempAgentId', tempAgentId)
            const adminSessionId = socketService.registerAsAdmin(tempAgentId)
            localStorage.setItem('adminSessionId', adminSessionId)
          }
          
          // Listen for new chat requests
          socketService.onNewChatRequest((data) => {
            // Use user name or default to Anonymous User
            const displayName = data.userName || 'Anonymous User'
            
            toast.info(`New chat request from ${displayName}`, {
              description: `Session ID: ${data.sessionId}`,
              action: {
                label: "View",
                onClick: () => setActiveChat(data.sessionId)
              }
            })
            
            // Automatically refresh chat sessions and requests
            fetchChatSessions()
            fetchChatRequests()
          })
          
          // Listen for user messages
          socketService.onUserMessage((data) => {
            // Update conversations if the message is for the active chat
            setConversations(prev => {
              const updatedConversations = [...prev]
              const conversationIndex = updatedConversations.findIndex(c => c.id === data.sessionId)
              
              if (conversationIndex >= 0) {
                const conversation = {...updatedConversations[conversationIndex]}
                conversation.messages = [...conversation.messages, {
                  id: conversation.messages.length + 1,
                  content: data.text || '',
                  sender: "user",
                  timestamp: formatTime(new Date()),
                  read: false
                }]
                conversation.lastActive = "Just now"
                updatedConversations[conversationIndex] = conversation
              }
              
              return updatedConversations
            })
            
            // If this is not the active chat, show a notification
            if (data.sessionId && data.sessionId !== activeChat && data.text) {
              // Find the conversation to get the display name
              const conversation = conversations.find(c => c.id === data.sessionId)
              const displayName = conversation ? 
                (conversation.userName || (conversation.ticketId ? `TK-${conversation.ticketId.substring(0, 4)}` : 'Anonymous User')) : 
                'User'
              
              toast.info(`New message from ${displayName}`, {
                description: data.text.length > 50 ? `${data.text.substring(0, 50)}...` : data.text
              })
            }
          })
          
          // Listen for conversation ended events
          socketService.onConversationEnded((data) => {
            // Update the conversation status
            setConversations(prev => {
              const updatedConversations = [...prev]
              const conversationIndex = updatedConversations.findIndex(c => c.id === data.sessionId)
              
              if (conversationIndex >= 0) {
                const conversation = {...updatedConversations[conversationIndex]}
                conversation.status = "closed"
                conversation.messages = [...conversation.messages, {
                  id: conversation.messages.length + 1,
                  content: "This conversation has been ended by the agent.",
                  sender: "system",
                  timestamp: formatTime(new Date()),
                  read: true
                }]
                updatedConversations[conversationIndex] = conversation
              }
              
              return updatedConversations
            })
            
            // Show notification if this is the active chat
            if (data.sessionId === activeChat) {
              toast.info("Conversation ended", {
                description: "You have ended this conversation."
              })
            }
          })
          
          // Listen for assignment confirmation
          socketService.onAssignmentConfirmed((data) => {
            // Update assigned chats
            setAssignedChats(prev => ({
              ...prev,
              [data.sessionId]: {
                agentName: data.agentName,
                timestamp: new Date(data.timestamp)
              }
            }))
            
            // Update conversation to show it's assigned to this agent
            setConversations(prev => {
              const updatedConversations = [...prev]
              const conversationIndex = updatedConversations.findIndex(c => c.id === data.sessionId)
              
              if (conversationIndex >= 0) {
                const conversation = {...updatedConversations[conversationIndex]}
                conversation.assignedAgent = data.agentName
                conversation.messages = [...conversation.messages, {
                  id: conversation.messages.length + 1,
                  content: `You have joined this conversation as ${data.agentName}.`,
                  sender: "system",
                  timestamp: formatTime(new Date()),
                  read: true
                }]
                updatedConversations[conversationIndex] = conversation
              }
              
              return updatedConversations
            })
            
            setJoiningChat(false)
            
            toast.success("You've joined the conversation", {
              description: "You can now send messages to the user."
            })
          })
          
          // Listen for assignment rejection
          socketService.onAssignmentRejected((data) => {
            setJoiningChat(false)
            
            toast.error("Couldn't join conversation", {
              description: data.reason || "The conversation may already be handled by another agent."
            })
          })
          
          // Listen for message rejection
          socketService.onMessageRejected((data) => {
            toast.error("Message not sent", {
              description: data.reason || "You may need to join this conversation first."
            })
          })
          
          // Listen for agent left events
          socketService.onAgentLeft((data) => {
            if (data.sessionId) {
              // Update assigned chats
              setAssignedChats(prev => {
                const updated = {...prev}
                delete updated[data.sessionId]
                return updated
              })
              
              // Update conversation to show the agent has left
              setConversations(prev => {
                const updatedConversations = [...prev]
                const conversationIndex = updatedConversations.findIndex(c => c.id === data.sessionId)
                
                if (conversationIndex >= 0) {
                  const conversation = {...updatedConversations[conversationIndex]}
                  conversation.assignedAgent = null
                  conversation.messages = [...conversation.messages, {
                    id: conversation.messages.length + 1,
                    content: "The agent has left the conversation. Another agent can join to continue.",
                    sender: "system",
                    timestamp: formatTime(new Date()),
                    read: true
                  }]
                  updatedConversations[conversationIndex] = conversation
                }
                
                return updatedConversations
              })
              
              // Show notification if this is the active chat
              if (data.sessionId === activeChat) {
                toast.info("Agent has left the conversation", {
                  description: "Another agent can join to continue the conversation."
                })
              }
            }
          })
        }
        
        // Try to fetch chat sessions and chat requests
        try {
          if (isChatServerAvailable) {
            await fetchChatSessions()
            await fetchChatRequests()
          } else {
            // Set empty data if server is not available
            setConversations([])
            setChatRequests([])
          }
        } catch (error) {
          console.error("Error fetching chat data:", error)
          toast.error("Failed to load chat data")
          // Set empty data on error
          setConversations([])
          setChatRequests([])
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error("Error initializing chat:", error)
        toast.error("Failed to connect to chat server", {
          description: "Please check if the chat server is running and try again."
        })
        setIsLoading(false)
        // Set empty data on error
        setConversations([])
        setChatRequests([])
      }
    }
    
    initSocket()
    
    // Cleanup socket connection on unmount
    return () => {
      socketService.disconnect()
    }
  }, [user])
  
  // Fetch chat sessions from the chatbot server
  const fetchChatSessions = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true)
    }
    
    try {
      const response = await chatService.getChatSessions()
      
      if (response && Array.isArray(response)) {
        // Format the chat sessions for display
        const formattedSessions = response.map(session => ({
          id: session.sessionId,
          user: {
            name: session.userName || 'Anonymous User',
            email: session.userEmail || 'No email provided',
            avatar: "",
            status: session.disconnectedAt ? "offline" : "online"
          },
          messages: session.messages.map((msg, index) => ({
            id: index + 1,
            content: msg.text,
            sender: msg.from === "agent" ? "agent" : "user",
            timestamp: formatTime(new Date(msg.createdAt)),
            read: true
          })),
          status: session.disconnectedAt ? "closed" : "active",
          lastActive: session.disconnectedAt ? 
            formatRelativeTime(new Date(session.disconnectedAt)) : 
            "Active now",
          ticketId: session.ticketId,
          assignedAgent: session.assignedAgent
        }))
        
        setConversations(formattedSessions)
        
        // Initialize assignedChats state with sessions that are assigned to the current user
        const currentUserName = user ? `${user.firstName} ${user.lastName}`.trim() : null
        const currentUserEmail = user ? user.email : null
        
        if (currentUserName || currentUserEmail) {
          const newAssignedChats = {}
          
          formattedSessions.forEach(session => {
            // If the session has an assignedAgent that matches the current user
            if (session.assignedAgent && 
                (session.assignedAgent === currentUserName || 
                 session.assignedAgent.includes(currentUserEmail))) {
              newAssignedChats[session.id] = {
                agentName: session.assignedAgent,
                timestamp: new Date()
              }
            }
          })
          
          setAssignedChats(newAssignedChats)
        }
      }
    } catch (error) {
      console.error("Error fetching chat sessions:", error)
      toast.error("Failed to load chat sessions")
    } finally {
      if (isManualRefresh) {
        setIsRefreshing(false)
      }
    }
  }
  
  // Fetch chat requests from tickets
  const fetchChatRequests = async (isManualRefresh = false) => {
    if (isManualRefresh && !isRefreshing) {
      setIsRefreshing(true)
    }
    
    try {
      const response = await chatService.getChatRequestTickets()
      
      if (response.data && response.data.tickets) {
        setChatRequests(response.data.tickets)
      }
    } catch (error) {
      console.error("Error fetching chat requests:", error)
    } finally {
      if (isManualRefresh) {
        setIsRefreshing(false)
      }
    }
  }
  
  // Format relative time (e.g., "2 hours ago")
  const formatRelativeTime = (date) => {
    const now = new Date()
    const diffMs = now - date
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)
    
    if (diffDay > 0) {
      return diffDay === 1 ? "Yesterday" : `${diffDay} days ago`
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
    } else {
      return "Just now"
    }
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeChat) return

    // Send message via socket
    const success = chatService.sendMessageViaSocket(activeChat, newMessage)
    
    if (success) {
      // Update local state
      const updatedConversations = conversations.map((conv) => {
        if (conv.id === activeChat) {
          return {
            ...conv,
            messages: [
              ...conv.messages,
              {
                id: conv.messages.length + 1,
                content: newMessage,
                sender: "agent",
                timestamp: formatTime(new Date()),
                read: false,
              },
            ],
          }
        }
        return conv
      })

      setConversations(updatedConversations)
      setNewMessage("")
    } else {
      toast.error("Failed to send message. Please try again.")
    }
  }

  const handleCloseChat = async () => {
    if (!activeChat) return

    try {
      // Find the conversation
      const conversation = conversations.find(c => c.id === activeChat)
      
      if (!conversation) {
        toast.error("Conversation not found")
        return
      }
      
      // Only admins can close conversations
      if (!user && !authLoading) {
        toast.error("You must be logged in to close conversations")
        return
      }
      
      // Check if the current agent is assigned to this conversation
      if (!assignedChats[activeChat]) {
        toast.error("You must be assigned to this conversation to close it")
        setCloseDialogOpen(false)
        return
      }
      
      // End the conversation via socket
      socketService.endConversation(activeChat)
      
      // Update local state (the socket event handler will also update this)
      const updatedConversations = conversations.map((conv) => {
        if (conv.id === activeChat) {
          return {
            ...conv,
            status: "closed",
          }
        }
        return conv
      })

      setConversations(updatedConversations)
      toast.success("Chat closed successfully")
    } catch (error) {
      console.error("Error closing chat:", error)
      toast.error("Failed to close chat")
    }
    
    setCloseDialogOpen(false)
  }
  
  // Handle opening the create ticket dialog
  const handleOpenCreateTicketDialog = () => {
    console.log("Create ticket button clicked");
    
    if (!activeChat) {
      console.log("No active chat selected");
      toast.error("No conversation selected");
      return;
    }
    
    // Find the conversation
    const conversation = conversations.find(c => c.id === activeChat);
    console.log("Active chat:", activeChat);
    console.log("Found conversation:", conversation);
    
    if (!conversation) {
      console.log("Conversation not found");
      toast.error("Conversation not found");
      return;
    }
    
    // Check if the current agent is assigned to this conversation
    console.log("Assigned chats:", assignedChats);
    console.log("Is assigned to this chat?", assignedChats[activeChat]);
    
    if (!assignedChats[activeChat]) {
      console.log("Agent not assigned to this conversation");
      toast.error("You must be assigned to this conversation to create a ticket");
      return;
    }
    
    // Set initial ticket data based on the conversation
    const ticketData = {
      subject: `Support request from ${conversation.user.name}`,
      description: `Chat session ID: ${conversation.id}\n\nChat transcript:\n${conversation.messages
        .map(msg => `${msg.sender === "user" ? conversation.user.name : "Agent"}: ${msg.content}`)
        .join('\n')}`,
      priority: "Medium",
      category: "General",
      channel: "Chat",
      sessionId: conversation.id
    };
    
    console.log("Setting new ticket data:", ticketData);
    setNewTicket(ticketData);
    
    console.log("Opening ticket creation dialog");
    setCreateTicketDialogOpen(true);
    toast.info("Create ticket dialog should open now");
  }
  
  // Handle ticket form field changes
  const handleTicketChange = (e) => {
    const { name, value } = e.target
    setNewTicket(prev => ({ ...prev, [name]: value }))
  }
  
  // Handle select field changes for the ticket form
  const handleTicketSelectChange = (name, value) => {
    setNewTicket(prev => ({ ...prev, [name]: value }))
  }
  
  // Handle creating a ticket from chat
  const handleCreateTicket = async (e) => {
    console.log("Form submitted for ticket creation");
    e.preventDefault();
    
    console.log("Ticket data to submit:", newTicket);
    
    if (!newTicket.subject || !newTicket.description) {
      console.log("Missing required fields");
      toast.error("Please fill in all required fields");
      return;
    }
    
    try {
      console.log("Setting isCreatingTicket to true");
      setIsCreatingTicket(true);
      
      console.log("Calling ticketService.createTicket");
      const response = await ticketService.createTicket(newTicket);
      console.log("Ticket creation response:", response);
      
      if (response && response.data && response.data.ticket) {
        // Update the conversation with the ticket ID
        const ticketId = response.data.ticket._id;
        console.log("Created ticket ID:", ticketId);
        
        // Update the conversation in the database
        console.log("Updating chat session with ticket ID");
        try {
          await chatService.updateChatSession(newTicket.sessionId, { ticketId });
          console.log("Chat session updated successfully");
        } catch (updateError) {
          console.error("Error updating chat session:", updateError);
          // Continue even if this fails - we still created the ticket
        }
        
        // Update local state
        console.log("Updating local conversation state");
        const updatedConversations = conversations.map((conv) => {
          if (conv.id === newTicket.sessionId) {
            return {
              ...conv,
              ticketId
            };
          }
          return conv;
        });
        
        setConversations(updatedConversations);
        toast.success("Ticket created successfully", {
          action: {
            label: "View Ticket",
            onClick: () => window.open(`/tickets/${ticketId}`, "_blank")
          }
        });
        
        console.log("Closing ticket dialog");
        setCreateTicketDialogOpen(false);
      } else {
        console.error("Invalid response format:", response);
        toast.error("Received invalid response from server");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Failed to create ticket. Please try again.");
    } finally {
      console.log("Setting isCreatingTicket to false");
      setIsCreatingTicket(false);
    }
  }

  // Handle assigning chat to current agent
  const handleAssignToMe = async (sessionId) => {
    if (!user && !authLoading) {
      toast.error("You must be logged in to assign chats")
      return
    }
    
    try {
      // Find the conversation
      const conversation = conversations.find(c => c.id === sessionId)
      
      if (!conversation) {
        toast.error("Conversation not found")
        return
      }
      
      // Check if the conversation is closed
      if (conversation.status === "closed") {
        toast.error("Cannot join a closed conversation")
        setJoiningChat(false)
        return
      }
      
      // Assign via socket
      const agentName = user && user.firstName && user.lastName ? 
        `${user.firstName} ${user.lastName}` : 
        (user && user.email) || "Support Agent"
      
      chatService.assignAgentViaSocket(sessionId, agentName)
      
      // If there's a ticket, assign it to the current user
      if (conversation.ticketId) {
        await ticketService.assignToSelf(conversation.ticketId)
        toast.success("Chat assigned to you")
      } else {
        toast.success("You are now handling this chat")
      }
    } catch (error) {
      console.error("Error assigning chat:", error)
      toast.error("Failed to assign chat")
      setJoiningChat(false)
    }
  }
  
  const filteredConversations = conversations.filter((conv) =>
      activeTab === "active" ? conv.status === "active" : conv.status === "closed"
  )

  const currentChat = conversations.find((conv) => conv.id === activeChat)

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {authLoading ? "Loading user data..." : "Loading chat data..."}
          </p>
        </div>
      </div>
    )
  }

  return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">Conversations</h1>
            <p className="text-xs text-muted-foreground">Manage customer conversations</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                fetchChatSessions(true);
                fetchChatRequests(true);
              }}
              disabled={isRefreshing}
              className="text-xs"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Refreshing...
                </>
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
          <Card className="md:col-span-1 flex flex-col h-[calc(100vh-12rem)]">
            <CardHeader className="px-4 py-3 border-b">
              <Tabs defaultValue="active" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="active" className="flex-1 text-xs">
                    Active
                  </TabsTrigger>
                  <TabsTrigger value="closed" className="flex-1 text-xs">
                    Closed
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0">
              <div className="divide-y">
                {filteredConversations.map((conversation) => (
                    <div
                        key={conversation.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 ${activeChat === conversation.id ? "bg-gray-50" : ""}`}
                        onClick={() => setActiveChat(conversation.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conversation.user.avatar} alt={conversation.user.name} />
                            <AvatarFallback>{getInitials(conversation.user.name)}</AvatarFallback>
                          </Avatar>
                          <span
                              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(conversation.user.status)}`}
                          ></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="font-medium text-sm truncate">{conversation.user.name}</p>
                            <p className="text-xs text-muted-foreground">{conversation.lastActive}</p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-muted-foreground truncate">{conversation.user.email}</p>
                            {assignedChats[conversation.id] ? (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                Joined
                              </span>
                            ) : conversation.assignedAgent ? (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                Assigned
                              </span>
                            ) : (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                Unassigned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                ))}
                {filteredConversations.length === 0 && (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      {activeTab === "active" ? (
                        <>
                          <p>No active conversations found.</p>
                          <p className="mt-2">Chat requests will appear here when users request assistance.</p>
                        </>
                      ) : (
                        "No closed conversations found."
                      )}
                    </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 flex flex-col h-[calc(100vh-12rem)]">
            {activeChat ? (
                <>
                  <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={currentChat?.user.avatar} alt={currentChat?.user.name} />
                        <AvatarFallback>{currentChat?.user ? getInitials(currentChat.user.name) : ""}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-sm font-medium">{currentChat?.user.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${getStatusColor(currentChat?.user.status)}`}></span>
                          <p className="text-xs text-muted-foreground">
                            {currentChat?.user.status === "online"
                                ? "Online"
                                : currentChat?.user.status === "away"
                                    ? "Away"
                                    : "Offline"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Video className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!assignedChats[activeChat] && !currentChat?.assignedAgent ? (
                            // For unassigned conversations, only show the join option if not closed
                            currentChat?.status === "active" ? (
                              <DropdownMenuItem className="text-xs" onClick={() => handleAssignToMe(activeChat)}>
                                Join conversation
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled className="text-xs">
                                Cannot join closed conversation
                              </DropdownMenuItem>
                            )
                          ) : assignedChats[activeChat] ? (
                            // For conversations assigned to the current agent, show all options
                            <>
                              <DropdownMenuItem className="text-xs" disabled>
                                You are assigned to this chat
                              </DropdownMenuItem>
                              {currentChat?.ticketId ? (
                                <DropdownMenuItem className="text-xs">
                                  <a href={`/tickets/${currentChat.ticketId}`} target="_blank" rel="noopener noreferrer">
                                    View ticket
                                  </a>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="text-xs" onClick={handleOpenCreateTicketDialog}>
                                  Create ticket
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {currentChat?.status === "active" ? (
                                <DropdownMenuItem onClick={() => setCloseDialogOpen(true)} className="text-xs text-red-600">
                                  Close conversation
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem disabled className="text-xs">
                                  Conversation closed
                                </DropdownMenuItem>
                              )}
                            </>
                          ) : (
                            // For conversations assigned to other agents, show limited options
                            <DropdownMenuItem disabled className="text-xs">
                              Assigned to {currentChat?.assignedAgent}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto p-4 space-y-4">
                    {currentChat?.messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.sender === "agent" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                  message.sender === "agent" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                              }`}
                          >
                            <p className="text-xs">{message.content}</p>
                            <div
                                className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                                    message.sender === "agent" ? "text-blue-100" : "text-gray-500"
                                }`}
                            >
                              {message.timestamp}
                              {message.sender === "agent" &&
                                  (message.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                            </div>
                          </div>
                        </div>
                    ))}
                  </CardContent>
                  <div className="p-4 border-t">
                    {currentChat?.status === "active" ? (
                        assignedChats[currentChat.id] ? (
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                              <Paperclip className="h-4 w-4" />
                            </Button>
                            <Input
                                placeholder="Type your message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="h-8 text-xs"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSendMessage()
                                  }
                                }}
                            />
                            <Button
                                variant="primary"
                                size="icon"
                                className="shrink-0 bg-blue-600 hover:bg-blue-700 h-8 w-8"
                                onClick={handleSendMessage}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <div className="text-center py-2 text-xs text-muted-foreground">
                              {currentChat?.status === "active" 
                                ? "You must join this conversation before you can send messages."
                                : "This conversation is closed and cannot be joined."}
                            </div>
                            {currentChat?.status === "active" ? (
                              <Button 
                                onClick={() => {
                                  setJoiningChat(true);
                                  handleAssignToMe(currentChat.id);
                                }}
                                disabled={joiningChat}
                                className="w-full text-xs"
                              >
                                {joiningChat ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Joining...
                                  </>
                                ) : (
                                  "Join Conversation"
                                )}
                              </Button>
                            ) : (
                              <Button disabled className="w-full text-xs">
                                Conversation Closed
                              </Button>
                            )}
                          </div>
                        )
                    ) : (
                        <div className="text-center py-2 text-xs text-muted-foreground">This conversation is closed.</div>
                    )}
                  </div>
                </>
            ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <h3 className="text-sm font-medium">Select a conversation</h3>
                    <p className="text-xs text-muted-foreground">Choose a conversation from the list to start chatting</p>
                  </div>
                </div>
            )}
          </Card>
        </div>

        <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-sm font-medium">Close Conversation</DialogTitle>
              <DialogDescription className="text-xs">
                Are you sure you want to close this conversation? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCloseDialogOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleCloseChat} className="text-xs">
                Close Conversation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Ticket Creation Dialog */}
        <Dialog open={createTicketDialogOpen} onOpenChange={setCreateTicketDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-sm font-medium">Create Ticket from Conversation</DialogTitle>
              <DialogDescription className="text-xs">
                Create a support ticket based on this conversation.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateTicket} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-xs">Subject *</Label>
                <Input
                  id="subject"
                  name="subject"
                  value={newTicket.subject}
                  onChange={handleTicketChange}
                  placeholder="Brief description of the issue"
                  className="text-xs"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={newTicket.description}
                  onChange={handleTicketChange}
                  placeholder="Detailed explanation of the issue"
                  rows={5}
                  className="text-xs"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-xs">Priority</Label>
                  <Select 
                    value={newTicket.priority} 
                    onValueChange={(value) => handleTicketSelectChange("priority", value)}
                  >
                    <SelectTrigger id="priority" className="text-xs">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-xs">Category</Label>
                  <Select 
                    value={newTicket.category} 
                    onValueChange={(value) => handleTicketSelectChange("category", value)}
                  >
                    <SelectTrigger id="category" className="text-xs">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="Billing">Billing</SelectItem>
                      <SelectItem value="Account">Account</SelectItem>
                      <SelectItem value="Feature Request">Feature Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="channel" className="text-xs">Channel</Label>
                  <Select 
                    value={newTicket.channel} 
                    onValueChange={(value) => handleTicketSelectChange("channel", value)}
                    disabled
                  >
                    <SelectTrigger id="channel" className="text-xs">
                      <SelectValue placeholder="Select channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Chat">Chat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setCreateTicketDialogOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatingTicket} className="text-xs">
                  {isCreatingTicket ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Ticket"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
  )
}