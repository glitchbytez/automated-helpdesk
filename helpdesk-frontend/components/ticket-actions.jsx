"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ticketService } from "@/lib/services/ticket-service"
import { userService } from "@/lib/services/user-service"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function TicketActions({ ticket, setTicket }) {
  const router = useRouter()
  const { user } = useAuth()
  const [status, setStatus] = useState(ticket.status)
  const [priority, setPriority] = useState(ticket.priority)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const [agents, setAgents] = useState([])
  const [selectedAgent, setSelectedAgent] = useState("")
  const [assignmentNote, setAssignmentNote] = useState("")
  const [closeReason, setCloseReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  
  // Determine if the current user can close the ticket
  const canCloseTicket = () => {
    // If the ticket is already closed, no one can close it again
    if (ticket.status === "Closed") return false;
    
    // REMOVED: We're now allowing tickets in Open status to be closed directly
    // This allows agents to close tickets at any stage in the workflow
    
    // If user is admin, they can close any ticket
    if (user?.role === "admin") {
      console.log("User is admin, can close ticket");
      return true;
    }
    
    // If no user is logged in, they can't close tickets
    if (!user) {
      console.log("No user logged in");
      return false;
    }
    
    // Get user ID as string for comparison
    const userId = String(user._id || user.id || '').trim();
    console.log("Current user ID:", userId);
    
    // From the logs, we can see the assignee is an object with nested properties
    if (ticket.assignee) {
      console.log("Ticket assignee:", ticket.assignee);
      
      // Based on the API response, the assignee has this structure:
      // assignee: {_id: '683587653bb4f24b9cc81868', firstName: 'Dev', lastName: 'Team', email: 'dev.team@example.com', ...}
      
      // Compare the user ID with the assignee ID
      if (typeof ticket.assignee === 'object') {
        // Check if the user ID matches the assignee ID
        if (ticket.assignee._id && ticket.assignee._id === userId) {
          console.log("✅ Match found by _id");
          return true;
        }
        
        // Check if the user ID matches the assignee id
        if (ticket.assignee.id && ticket.assignee.id === userId) {
          console.log("✅ Match found by id");
          return true;
        }
        
        // Check if the user email matches the assignee email
        if (ticket.assignee.email && user.email && 
            ticket.assignee.email.toLowerCase() === user.email.toLowerCase()) {
          console.log("✅ Match found by email");
          return true;
        }
      }
      
      // Handle case where assignee is just a string ID
      if (typeof ticket.assignee === 'string' && ticket.assignee === userId) {
        console.log("✅ Match found with string assignee");
        return true;
      }
    }
    
    // By default, users cannot close tickets they're not assigned to
    console.log("❌ User is not assigned to ticket and not admin");
    return false;
  }

  // No longer need permission issue tracking since we prevent the API call entirely

  // Fetch agents for the reassign dialog - only if user is admin
  useEffect(() => {
    const fetchAgents = async () => {
      // Only fetch agents if the user is an admin
      if (!user || user.role !== "admin") {
        // For non-admin users, just add themselves as the only option if they're logged in
        if (user) {
          setAgents([{
            id: user._id || user.id,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || "Current User",
            email: user.email,
            isCurrentUser: true
          }])
        } else {
          setAgents([])
        }
        return; // Skip the API call entirely
      }
      
      // Only admins proceed past this point to make the API call
      try {
        setIsLoading(true)
        const response = await userService.getAgents()
        
        if (response && response.data && response.data.agents) {
          // Format agents for the select dropdown
          const formattedAgents = response.data.agents.map(agent => ({
            id: agent._id || agent.id,
            name: `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || agent.email,
            email: agent.email
          }))
          setAgents(formattedAgents)
        } else {
          console.warn("Unexpected agent data format:", response)
          setAgents([])
        }
      } catch (error) {
        console.error("Error fetching agents:", error)
        toast.error("Failed to load agents")
        setAgents([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchAgents()
  }, [user])

  const handleStatusChange = (value) => {
    setStatus(value)
    // Status is disabled, so this won't be called
  }

  const handlePriorityChange = (value) => {
    setPriority(value)
    // Priority is disabled, so this won't be called
  }

  const handleAssignToSelf = async () => {
    try {
      setIsLoading(true)
      const response = await ticketService.assignToSelf(ticket._id)
      
      if (response.data && response.data.ticket) {
        setTicket(response.data.ticket)
        toast.success("Ticket assigned to you successfully")
      }
    } catch (error) {
      console.error("Error assigning ticket:", error)
      toast.error("Failed to assign ticket. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignTicket = async () => {
    if (!selectedAgent) {
      toast.error("Please select an agent")
      return
    }

    try {
      setIsLoading(true)
      
      // Find the selected agent to get their name for the note
      const agent = agents.find(a => a.id === selectedAgent)
      const agentName = agent ? agent.name : 'Unknown agent'
      
      console.log(`Assigning ticket ${ticket._id} to agent ${selectedAgent} (${agentName})`)
      
      // Use updateTicket instead of assignTicket to avoid backend controller issues
      // This directly updates the assignee field of the ticket
      const response = await ticketService.updateTicket(ticket._id, { assignee: selectedAgent })
      
      console.log('Ticket assignment response:', response)
      
      if (response.data && response.data.ticket) {
        // Get the updated ticket with populated assignee data
        const updatedTicket = response.data.ticket
        console.log('Updated ticket:', updatedTicket)
        
        // Update the local ticket state with the response data
        setTicket(updatedTicket)
        toast.success(`Ticket reassigned to ${agentName}`)
        
        // Add a note if provided
        if (assignmentNote.trim()) {
          await ticketService.addNote(ticket._id, { content: `Reassigned to ${agentName}. Note: ${assignmentNote}` })
        } else {
          // Add a default note about the reassignment
          await ticketService.addNote(ticket._id, { content: `Ticket reassigned to ${agentName}` })
        }
        
        setIsAssignDialogOpen(false)
        setSelectedAgent("")
        setAssignmentNote("")
        
        // Fetch the ticket again to ensure we have the latest data with populated fields
        try {
          const refreshResponse = await ticketService.getTicket(ticket._id)
          if (refreshResponse.data && refreshResponse.data.ticket) {
            setTicket(refreshResponse.data.ticket)
          }
        } catch (refreshError) {
          console.error("Error refreshing ticket data:", refreshError)
        }
        
        // Force refresh to ensure UI is updated
        router.refresh()
      } else {
        console.warn("Unexpected response format:", response)
        toast.error("Received unexpected response format. Please try again.")
      }
    } catch (error) {
      console.error("Error reassigning ticket:", error)
      toast.error(`Failed to reassign ticket: ${error.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseTicket = async () => {
    try {
      setIsClosing(true)
      
      // Update the ticket status to Closed
      const response = await ticketService.updateTicket(ticket._id, { status: "Closed" })
      
      if (response.data && response.data.ticket) {
        setTicket(response.data.ticket)
        toast.success("Ticket closed successfully")
        
        // Add a note with the closing reason if provided
        if (closeReason.trim()) {
          await ticketService.addNote(ticket._id, { content: `Closing reason: ${closeReason}` })
        }
        
        setIsCloseDialogOpen(false)
        setCloseReason("")
        
        // Refresh the page to update the UI
        router.refresh()
      }
    } catch (error) {
      console.error("Error closing ticket:", error)
      toast.error("Failed to close ticket. Please try again.")
    } finally {
      setIsClosing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={handleStatusChange} disabled>
          <SelectTrigger id="status" className="bg-gray-50">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority</Label>
        <Select value={priority} onValueChange={handlePriorityChange} disabled>
          <SelectTrigger id="priority" className="bg-gray-50">
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
        <Label>Assignment</Label>
        <div className="flex flex-col gap-2">
          {!ticket.assignee && (
            <Button 
              onClick={handleAssignToSelf} 
              variant="outline"
              disabled={isLoading || ticket.status === "Closed"}
            >
              {isLoading ? (
                <>
                  <div className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  Assigning...
                </>
              ) : (
                "Assign to me"
              )}
            </Button>
          )}

          {/* Only show the Assign to Agent button if the user is an admin */}
          {user?.role === "admin" && (
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={ticket.status === "Closed" || isLoading}
                >
                  {ticket.assignee ? "Reassign Ticket" : "Assign to Agent"}
                </Button>
              </DialogTrigger>
              <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Ticket</DialogTitle>
                <DialogDescription>
                  Select an agent to assign this ticket to.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="agent">Agent</Label>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger disabled={isLoading}>
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.length > 0 ? (
                        agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name} {agent.email ? `(${agent.email})` : ''}
                            {agent.isCurrentUser && " (You)"}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
                          No agents available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Note (optional)</Label>
                  <Textarea 
                    id="note" 
                    placeholder="Add a note about this assignment" 
                    value={assignmentNote}
                    onChange={(e) => setAssignmentNote(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleAssignTicket} disabled={isLoading || !selectedAgent}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reassigning...
                    </>
                  ) : (
                    "Reassign"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {/* Add debugging to see what's happening with canCloseTicket */}
      {console.log("Ticket status:", ticket.status)}
      {console.log("Can close ticket result:", canCloseTicket())}
      {console.log("Full ticket object:", ticket)}
      {console.log("Current user:", user)}
      
      {ticket.status === "Closed" ? (
        <Button 
          className="w-full" 
          variant="outline"
          disabled={true}
        >
          Ticket Closed
        </Button>
      ) : canCloseTicket() ? (
        <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="w-full" 
              disabled={isClosing}
              variant="default"
            >
              Close Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Close Ticket</DialogTitle>
              <DialogDescription>Are you sure you want to close this ticket? This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="closeReason">Reason for closing (optional)</Label>
                <Textarea 
                  id="closeReason" 
                  placeholder="Add a reason for closing this ticket" 
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCloseDialogOpen(false)} disabled={isClosing}>
                Cancel
              </Button>
              <Button onClick={handleCloseTicket} disabled={isClosing} variant="destructive">
                {isClosing ? (
                  <>
                    <div className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    Closing...
                  </>
                ) : (
                  "Close Ticket"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <div className="border border-amber-200 bg-amber-50 rounded-md p-3 text-sm text-amber-800 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Permission required</p>
            <p className="text-xs mt-1">Only the assigned agent or an admin can close this ticket.</p>
          </div>
        </div>
      )}
    </div>
  )
}

