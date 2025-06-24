"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { X, Filter } from "lucide-react"

export function TicketFilters({ statusFilters = [], setStatusFilters = () => {}, priorityFilters = [], setPriorityFilters = () => {} }) {

  const statuses = ["Open", "In Progress", "Pending", "Resolved", "Closed"]
  const priorities = ["Low", "Medium", "High", "Urgent"]
  // Removed agents array as per requirement

  const toggleStatus = (status) => {
    setStatusFilters((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
  }

  const togglePriority = (priority) => {
    setPriorityFilters((prev) => (prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]))
  }

  // Removed toggleAgent function as per requirement

  const clearFilters = () => {
    setStatusFilters([])
    setPriorityFilters([])

    // If the global filter function is available, use it
    if (typeof window !== "undefined" && window.updateTicketFilters) {
      window.updateTicketFilters.clearFilters()
    }
  }

  const removeFilter = (type, value) => {
    if (type === "status") {
      setStatusFilters((prev) => prev.filter((s) => s !== value))
    } else if (type === "priority") {
      setPriorityFilters((prev) => prev.filter((p) => p !== value))
    }
  }

  // No need for this effect anymore as we're using props directly

  const hasFilters = statusFilters.length > 0 || priorityFilters.length > 0

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 px-3 text-xs">
              <Filter className="h-3 w-3 mr-1.5" />
              Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuLabel className="text-xs">Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {statuses.map((status) => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={statusFilters.includes(status)}
                onCheckedChange={() => toggleStatus(status)}
                className="text-xs"
              >
                {status}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 px-3 text-xs">
              <Filter className="h-3 w-3 mr-1.5" />
              Priority
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuLabel className="text-xs">Filter by Priority</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {priorities.map((priority) => (
              <DropdownMenuCheckboxItem
                key={priority}
                checked={priorityFilters.includes(priority)}
                onCheckedChange={() => togglePriority(priority)}
                className="text-xs"
              >
                {priority}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Agent filter removed as per requirement */}

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-3 text-xs">
            Clear filters
          </Button>
        )}
      </div>

      {hasFilters && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {statusFilters.map((status) => (
            <Badge key={status} variant="outline" className="text-[10px] py-0 px-1.5 h-5 bg-gray-50 border-gray-200">
              Status: {status}
              <Button
                variant="ghost"
                size="icon"
                className="h-3.5 w-3.5 ml-1 p-0 hover:bg-transparent"
                onClick={() => removeFilter("status", status)}
              >
                <X className="h-2.5 w-2.5" />
              </Button>
            </Badge>
          ))}

          {priorityFilters.map((priority) => (
            <Badge key={priority} variant="outline" className="text-[10px] py-0 px-1.5 h-5 bg-gray-50 border-gray-200">
              Priority: {priority}
              <Button
                variant="ghost"
                size="icon"
                className="h-3.5 w-3.5 ml-1 p-0 hover:bg-transparent"
                onClick={() => removeFilter("priority", priority)}
              >
                <X className="h-2.5 w-2.5" />
              </Button>
            </Badge>
          ))}

          {/* Agent filter badges removed as per requirement */}
        </div>
      )}
    </div>
  )
}

