"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ChevronLeft, Loader2 } from "lucide-react"
import { ticketService } from "@/lib/services/ticket-service"
import { toast } from "sonner"

export default function NewTicketPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ticket, setTicket] = useState({
    subject: "",
    description: "",
    priority: "Medium",
    category: "General",
    channel: "Web",
    requester: {
      email: "",
      registrationNumber: "",
      name: ""
    }
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // Handle nested requester fields
    if (name.startsWith('requester.')) {
      const requesterField = name.split('.')[1]
      setTicket(prev => ({
        ...prev,
        requester: {
          ...prev.requester,
          [requesterField]: value
        }
      }))
    } else {
      setTicket(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSelectChange = (name, value) => {
    setTicket(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!ticket.subject || !ticket.description || !ticket.requester.email || !ticket.requester.registrationNumber) {
      toast.error("Please fill in all required fields")
      return
    }
    
    try {
      setIsSubmitting(true)
      const response = await ticketService.createTicket(ticket)
      
      if (response.data && response.data.ticket) {
        toast.success("Ticket created successfully")
        router.push(`/tickets/${response.data.ticket._id}`)
      }
    } catch (error) {
      console.error("Error creating ticket:", error)
      toast.error("Failed to create ticket. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tickets">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Create New Ticket</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                name="subject"
                value={ticket.subject}
                onChange={handleChange}
                placeholder="Brief description of the issue"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={ticket.description}
                onChange={handleChange}
                placeholder="Detailed explanation of the issue"
                rows={5}
                required
              />
            </div>
            
            <div className="space-y-4 border p-4 rounded-md">
              <h3 className="font-medium">Requester Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="requester.email">Email *</Label>
                  <Input
                    id="requester.email"
                    name="requester.email"
                    value={ticket.requester.email}
                    onChange={handleChange}
                    placeholder="Requester's email address"
                    required
                    type="email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="requester.registrationNumber">Registration Number *</Label>
                  <Input
                    id="requester.registrationNumber"
                    name="requester.registrationNumber"
                    value={ticket.requester.registrationNumber}
                    onChange={handleChange}
                    placeholder="Requester's registration number"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="requester.name">Name (Optional)</Label>
                  <Input
                    id="requester.name"
                    name="requester.name"
                    value={ticket.requester.name}
                    onChange={handleChange}
                    placeholder="Requester's name"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={ticket.priority} 
                  onValueChange={(value) => handleSelectChange("priority", value)}
                >
                  <SelectTrigger id="priority">
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
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={ticket.category} 
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger id="category">
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
                <Label htmlFor="channel">Channel</Label>
                <Select 
                  value={ticket.channel} 
                  onValueChange={(value) => handleSelectChange("channel", value)}
                >
                  <SelectTrigger id="channel">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Web">Web</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="Phone">Phone</SelectItem>
                    <SelectItem value="Chat">Chat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" asChild>
                <Link href="/tickets">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Ticket"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
