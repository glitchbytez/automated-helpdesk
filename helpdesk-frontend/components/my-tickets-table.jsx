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

export function MyTicketsTable({ searchQuery = "", statusFilters = [], priorityFilters = [] }) {
  const [sorting, setSorting] = useState([])
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch my tickets from API
  useEffect(() => {
    const fetchMyTickets = async () => {
      try {
        setIsLoading(true)
        const response = await ticketService.getMyTickets()
        
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
            assignee: ticket.assignee ? {
              name: `${ticket.assignee.firstName} ${ticket.assignee.lastName}`,
              avatar: ticket.assignee.avatar || "",
            } : null,
            createdAt: ticket.createdAt,
            updatedAt: ticket.updatedAt,
          }))
          
          setData(formattedTickets)
          setFilteredData(formattedTickets)
        }
      } catch (error) {
        console.error("Error fetching my tickets:", error)
        toast({
          title: "Error",
          description: "Failed to load your assigned tickets. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchMyTickets()
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

  const columns = [
    {
      accessorKey: "id",
      header: "Ticket ID",
      cell: ({ row }) => (
        <Link href={`/tickets/${row.original.id}`} className="text-xs font-medium hover:underline">
          {row.original.id}
        </Link>
      ),
    },
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }) => (
        <Link
          href={`/tickets/${row.original.id}`}
          className="text-xs font-medium hover:underline max-w-[200px] md:max-w-[300px] truncate block"
        >
          {row.original.subject}
        </Link>
      ),
    },
    {
      accessorKey: "requester.name",
      header: "Requester",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={row.original.requester.avatar} alt={row.original.requester.name} />
            <AvatarFallback className="text-[10px]">{getEmailInitials(row.original.requester.email)}</AvatarFallback>
          </Avatar>
          <span className="hidden md:inline text-xs">{row.original.requester.name}</span>
          <span className="md:hidden text-xs">{getEmailInitials(row.original.requester.email)}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hidden md:flex text-xs p-0 h-auto font-medium"
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
      cell: ({ row }) => <span className="hidden md:inline text-xs">{formatDate(row.original.createdAt)}</span>,
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
    <div className="overflow-hidden">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-gray-50 hover:bg-gray-50">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`${header.id.includes("createdAt") ? "hidden md:table-cell" : ""} h-8 text-xs font-medium text-gray-500`}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
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
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="h-10">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={`${cell.column.id === "createdAt" ? "hidden md:table-cell" : ""} py-1.5 px-3 text-xs`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-xs">
                  No tickets assigned to you.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between py-2">
        <div className="text-xs text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{" "}
          of {table.getFilteredRowModel().rows.length} tickets
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-7 px-3 text-xs"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-7 px-3 text-xs"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const statusStyles = {
    open: "bg-blue-50 text-blue-700 border-blue-200",
    "in-progress": "bg-amber-50 text-amber-700 border-amber-200",
    pending: "bg-purple-50 text-purple-700 border-purple-200",
    resolved: "bg-green-50 text-green-700 border-green-200",
    closed: "bg-gray-50 text-gray-700 border-gray-200",
  }

  const statusClass = statusStyles[status.toLowerCase().replace(" ", "-")] || "bg-gray-50 text-gray-700 border-gray-200"

  return (
    <Badge variant="outline" className={`${statusClass} text-xs font-medium`}>
      {status}
    </Badge>
  )
}

function PriorityBadge({ priority }) {
  const priorityStyles = {
    urgent: "bg-red-50 text-red-700 border-red-200",
    high: "bg-orange-50 text-orange-700 border-orange-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-green-50 text-green-700 border-green-200",
  }

  const priorityClass = priorityStyles[priority.toLowerCase()] || "bg-gray-50 text-gray-700 border-gray-200"

  return (
    <Badge variant="outline" className={`${priorityClass} text-xs font-medium`}>
      {priority}
    </Badge>
  )
}

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

function getEmailInitials(email) {
  if (!email || email.length < 2) return "??";
  return email.substring(0, 2).toUpperCase();
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date)
}
