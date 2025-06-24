"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TicketTable } from "@/components/ticket-table"
import { TicketFilters } from "@/components/ticket-filters"
import { Plus, Filter } from "lucide-react"

export default function TicketsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilters, setStatusFilters] = useState([])
  const [priorityFilters, setPriorityFilters] = useState([])
  
  // Make filter functions available globally for the filter component
  if (typeof window !== "undefined") {
    window.updateTicketFilters = {
      setStatusFilters,
      setPriorityFilters,
      clearFilters: () => {
        setStatusFilters([])
        setPriorityFilters([])
      }
    }
  }
  
  return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Tickets</h1>
            <p className="text-xs text-muted-foreground">Manage and respond to support tickets</p>
          </div>
          <Button size="sm" className="h-8">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            <Link href="/tickets/new">New Ticket</Link>
          </Button>
        </div>

        <Card className="p-0 overflow-hidden border border-gray-200">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-medium">All Tickets</h2>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-none">
                <Input 
                  placeholder="Search tickets..." 
                  className="h-8 w-full sm:w-[200px] text-xs pl-8" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-gray-500"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                <Filter className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <TicketFilters 
                  statusFilters={statusFilters} 
                  setStatusFilters={setStatusFilters}
                  priorityFilters={priorityFilters}
                  setPriorityFilters={setPriorityFilters}
                />
              </div>
              <div className="overflow-x-auto">
                <TicketTable 
                  searchQuery={searchQuery} 
                  statusFilters={statusFilters} 
                  priorityFilters={priorityFilters} 
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
  )
}

