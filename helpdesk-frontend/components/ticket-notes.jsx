"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ticketService } from "@/lib/services/ticket-service"
import { toast } from "sonner"

export function TicketNotes({ ticketId, ticket, isActive }) {
  const [note, setNote] = useState("")
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Load notes when component mounts or when the tab becomes active
  useEffect(() => {
    const loadNotes = async () => {
      if (!ticketId) return
      
      try {
        setIsLoading(true)
        const response = await ticketService.getTicket(ticketId)
        
        // Notes are returned directly in the response.data.notes array
        if (response.data && response.data.notes) {
          // Format notes for display
          const formattedNotes = response.data.notes.map((note) => ({
            id: note._id,
            author: {
              name: `${note.author.firstName} ${note.author.lastName}`,
              avatar: note.author.avatar || "",
            },
            content: note.content,
            timestamp: note.createdAt,
          }))
          setNotes(formattedNotes)
        }
      } catch (error) {
        console.error("Error loading notes:", error)
        toast({
          title: "Error",
          description: "Failed to load notes. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadNotes()
  }, [ticketId, isActive])

  const handleAddNote = async (e) => {
    e.preventDefault()

    if (!note.trim() || !ticketId) return

    try {
      // Optimistically update UI
      const tempNote = {
        id: `temp-${Date.now()}`,
        author: {
          name: "You", // This will be replaced by the actual user name from the API response
          avatar: "",
        },
        content: note,
        timestamp: new Date().toISOString(),
      }

      setNotes([...notes, tempNote])
      setNote("")

      // Send note to API
      await ticketService.addNote(ticketId, { content: note })
      
      // Reload all notes to get the updated list
      const response = await ticketService.getTicket(ticketId)
      
      // Notes are returned directly in the response.data.notes array
      if (response.data && response.data.notes) {
        const formattedNotes = response.data.notes.map((note) => ({
          id: note._id,
          author: {
            name: `${note.author.firstName} ${note.author.lastName}`,
            avatar: note.author.avatar || "",
          },
          content: note.content,
          timestamp: note.createdAt,
        }))
        setNotes(formattedNotes)
      }
    } catch (error) {
      console.error("Error adding note:", error)
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive",
      })
      // Remove the optimistic note
      setNotes(notes.filter(n => n.id !== `temp-${Date.now()}`))
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-16">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No notes yet
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="flex gap-3 p-3 rounded-lg border">
              <Avatar>
                <AvatarImage src={note.author.avatar} alt={note.author.name} />
                <AvatarFallback>{getInitials(note.author.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{note.author.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(note.timestamp)}</p>
                </div>
                <p className="mt-1 text-sm">{note.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {ticket && ticket.status === "Closed" ? (
        <div className="p-4 pt-0 border-t mt-auto bg-gray-50 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">This ticket is closed. You cannot add new notes.</p>
        </div>
      ) : (
        <form onSubmit={handleAddNote} className="p-4 pt-0 border-t mt-auto">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add an internal note..."
            className="h-20 max-h-20 resize-none overflow-auto mb-2"
            disabled={isLoading || (ticket && ticket.status === "Closed")}
          />
          <Button type="submit" disabled={!note.trim() || isLoading || (ticket && ticket.status === "Closed")}>
            Add Note
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

function formatDate(dateString) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date)
}
