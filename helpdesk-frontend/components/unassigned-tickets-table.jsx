"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ticketService } from "@/lib/services/ticket-service"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

export function UnassignedTicketsTable({ searchQuery = "", statusFilters = [], priorityFilters = [] }) {
  const [sorting, setSorting] = useState([])
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [assigningTicket, setAssigningTicket] = useState(null)

  // Function to handle assigning a ticket to the current user
  const handleAssignToSelf = async (ticketId, status) => {
    // Check if the ticket is closed before making the API call
    if (status === 'Closed') {
      toast.error("Cannot assign a closed ticket")
      return
    }
    
    try {
      setAssigningTicket(ticketId)
      
      // Call the API to assign the ticket to the current user
      const response = await ticketService.assignToSelf(ticketId)
      
      if (response.data && response.data.ticket) {
        // Remove the ticket from the list of unassigned tickets
        setData(prevData => prevData.filter(ticket => ticket.id !== ticketId))
        
        // Show success message
        toast.success("Ticket assigned to you successfully")
      }
    } catch (error) {
      console.error("Error assigning ticket:", error)
      
      // Check for specific error messages from the API
      const errorMessage = error.response?.data?.message || "Failed to assign ticket. Please try again."
      
      if (errorMessage.includes("closed")) {
        toast.error("Cannot assign a closed ticket")
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setAssigningTicket(null)
    }
  }

  // Fetch unassigned tickets from API
  useEffect(() => {
    const fetchUnassignedTickets = async () => {
      try {
        setIsLoading(true)
        const response = await ticketService.getUnassignedTickets()
        
        if (response.data && response.data.tickets) {
          // Format tickets for display
          const formattedTickets = response.data.tickets.map(ticket => ({
            id: ticket._id,
            subject: ticket.subject,
            requester: {
              // Use registration number as the display name
              name: ticket.requester?.registrationNumber || 'N/A',
              // Store email for avatar fallback
              email: ticket.requester?.email || 'unknown@example.com',
              // Store full requester object for tooltip
              fullInfo: ticket.requester || {},
              avatar: "",
            },
            status: ticket.status,
            priority: ticket.priority,
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
          }))
          
          setData(formattedTickets)
          setFilteredData(formattedTickets)
        }
      } catch (error) {
        console.error("Error fetching unassigned tickets:", error)
        toast({
          title: "Error",
          description: "Failed to load unassigned tickets. Please try again.",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUnassignedTickets()
  }, [])

  // Apply filters and search query
  useEffect(() => {
    let result = [...data]

    // Apply search query to subject field
    if (searchQuery && searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter((ticket) => 
        ticket.subject.toLowerCase().includes(query)
      )
    }

    // Apply status filters
    if (statusFilters.length > 0) {
      result = result.filter((ticket) => statusFilters.includes(ticket.status))
    }

    // Apply priority filters
    if (priorityFilters.length > 0) {
      result = result.filter((ticket) => priorityFilters.includes(ticket.priority))
    }

    setFilteredData(result)
  }, [searchQuery, statusFilters, priorityFilters, data])

  // Define columns for the table
  const columns = [
    {
      accessorKey: "id",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            ID
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-1 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-1 h-3 w-3" />
            ) : (
              <ChevronsUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => <div className="text-xs font-medium">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "subject",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Subject
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-1 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-1 h-3 w-3" />
            ) : (
              <ChevronsUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => (
        <Link href={`/tickets/${row.original.id}`} className="text-xs font-medium hover:underline">
          {row.getValue("subject")}
        </Link>
      ),
    },
    {
      accessorKey: "requester",
      header: "Requester",
      cell: ({ row }) => {
        const requester = row.getValue("requester")
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={requester.avatar} alt={requester.name} />
              <AvatarFallback>{getEmailInitials(requester.email)}</AvatarFallback>
            </Avatar>
            <div className="text-xs">{requester.name}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status")
        return (
          <Badge
            variant="outline"
            className={`text-[10px] py-0 px-1.5 h-5 ${
              status === "Open"
                ? "bg-green-50 text-green-700 border-green-200"
                : status === "Pending"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : status === "Closed"
                ? "bg-gray-50 text-gray-700 border-gray-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.getValue("priority")
        return (
          <Badge
            variant="outline"
            className={`text-[10px] py-0 px-1.5 h-5 ${
              priority === "High"
                ? "bg-red-50 text-red-700 border-red-200"
                : priority === "Medium"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            {priority}
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-0 hover:bg-transparent"
          >
            Created
            {column.getIsSorted() === "asc" ? (
              <ChevronUp className="ml-1 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ChevronDown className="ml-1 h-3 w-3" />
            ) : (
              <ChevronsUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => {
        return <div className="text-xs">{formatDate(row.getValue("createdAt"))}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const status = row.getValue("status")
        const isDisabled = status === "Closed" || assigningTicket === row.original.id
        
        return (
          <Button 
            size="sm" 
            variant={status === "Closed" ? "ghost" : "outline"}
            className={`h-7 text-xs ${status === "Closed" ? "text-gray-400 cursor-not-allowed" : ""}`}
            onClick={() => handleAssignToSelf(row.original.id, status)}
            disabled={isDisabled}
            title={status === "Closed" ? "Cannot assign closed tickets" : "Assign this ticket to yourself"}
          >
            {assigningTicket === row.original.id ? (
              <>
                <div className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                Assigning...
              </>
            ) : status === "Closed" ? (
              "Cannot assign"
            ) : (
              "Assign to me"
            )}
          </Button>
        )
      },
    },
  ]

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="rounded-md border border-gray-200">
      <Table>
        <TableHeader className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent border-gray-200">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id} className="h-8 text-xs font-medium text-gray-500">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                No unassigned tickets found
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="h-10 hover:bg-gray-50 border-gray-200">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-1.5 px-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            data.length
          )}{" "}
          of {data.length} entries
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return "N/A"
  return formatDistanceToNow(new Date(dateString), { addSuffix: true })
}

// Helper function to get initials
function getInitials(name) {
  if (!name) return ""
  
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

// Helper function to get email initials
function getEmailInitials(email) {
  if (!email || email.length < 2) return "??";
  return email.substring(0, 2).toUpperCase();
}
