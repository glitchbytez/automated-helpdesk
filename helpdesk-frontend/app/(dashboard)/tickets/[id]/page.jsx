"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TicketChat } from "@/components/ticket-chat"
import { TicketActions } from "@/components/ticket-actions"
import { TicketNotes } from "@/components/ticket-notes"
import { TicketHistory } from "@/components/ticket-history"
import { ChevronLeft } from "lucide-react"
import { ticketService } from "@/lib/services/ticket-service"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

export default function TicketDetailPage() {
  const params = useParams()
  const [ticket, setTicket] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("conversation")
  const ticketId = params?.id

  // Prevent this route from handling "my-tickets" and "unassigned"
  if (ticketId === "my-tickets" || ticketId === "unassigned" || ticketId === "new") {
    return null
  }

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        setIsLoading(true)
        const response = await ticketService.getTicket(ticketId)
        
        if (response.data && response.data.ticket) {
          setTicket(response.data.ticket)
        } else {
          setError("Ticket not found")
        }
      } catch (error) {
        console.error("Error fetching ticket:", error)
        setError("Failed to load ticket data. Please try again.")
        toast.error("Failed to load ticket data. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    if (ticketId && ticketId !== "new") {
      fetchTicket()
    }
  }, [ticketId])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p className="text-muted-foreground">{error || "Ticket not found"}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/tickets">Back to Tickets</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <div className="flex items-center gap-2 py-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/tickets">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Ticket {ticket.id || ticket._id}</h1>
        <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800">
          {ticket.status}
        </Badge>
        <Badge variant="outline" className="bg-amber-100 text-amber-800">
          {ticket.priority}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3 flex-1 overflow-hidden">
        <div className="md:col-span-2 flex flex-col gap-4 overflow-hidden">
          <Card className="shrink-0">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">{ticket.subject}</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                <span>
                  Created {ticket.createdAt ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true }) : "recently"}
                </span>
                <span>•</span>
                <span>Category: {ticket.category || "General"}</span>
                <span>•</span>
                <span>Channel: {ticket.channel || "Web"}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          <Tabs defaultValue="conversation" className="flex flex-col flex-1 overflow-hidden" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 shrink-0">
              <TabsTrigger value="conversation" className="text-xs">Conversation</TabsTrigger>
              <TabsTrigger value="notes" className="text-xs">Internal Notes</TabsTrigger>
              <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-hidden">
              <TabsContent value="conversation" className="p-0 mt-2 h-full overflow-hidden">
                <TicketChat ticketId={ticket._id} ticket={ticket} />
              </TabsContent>
              <TabsContent value="notes" className="p-0 mt-2 h-full overflow-hidden">
                <TicketNotes ticketId={ticket._id} ticket={ticket} isActive={activeTab === "notes"} />
              </TabsContent>
              <TabsContent value="history" className="p-0 mt-2 h-full overflow-hidden">
                <TicketHistory ticketId={ticket._id} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="space-y-4 overflow-auto pr-1 max-h-full">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Requester</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">{ticket.requester?.name || "Not specified"}</p>
                  <p className="text-xs text-muted-foreground">{ticket.requester?.email || "No email provided"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium">Registration Number:</p>
                  <p className="text-xs text-muted-foreground">{ticket.requester?.registrationNumber || "Not provided"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">Assignee</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              {ticket.assignee ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={ticket.assignee.avatar} alt={ticket.assignee.name} />
                    <AvatarFallback>
                      {ticket.assignee.firstName && ticket.assignee.lastName
                        ? `${ticket.assignee.firstName[0]}${ticket.assignee.lastName[0]}`
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {ticket.assignee.firstName && ticket.assignee.lastName
                        ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}`
                        : ticket.assignee.name || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">{ticket.assignee.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Unassigned</p>
              )}
            </CardContent>
          </Card>

          <TicketActions ticket={ticket} setTicket={setTicket} />
        </div>
      </div>
    </div>
  )
}
