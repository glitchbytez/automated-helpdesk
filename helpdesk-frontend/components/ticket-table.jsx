"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { ticketService } from "@/lib/services/ticket-service"
import { toast } from "sonner"

export function TicketTable({ searchQuery = "", statusFilters = [], priorityFilters = [] }) {
  const [sorting, setSorting] = useState([])
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch tickets from API
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setIsLoading(true)
        const response = await ticketService.getTickets()
        
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
        console.error("Error fetching tickets:", error)
        toast({
          title: "Error",
          description: "Failed to load tickets. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTickets()
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
      header: "ID",
      cell: ({ row }) => (
          <Link href={`/tickets/${row.original.id}`} className="text-xs font-medium text-blue-600 hover:underline">
            {row.original.id}
          </Link>
      ),
      size: 100,
    },
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }) => (
          <Link href={`/tickets/${row.original.id}`} className="text-xs font-medium hover:underline">
            {row.original.subject}
          </Link>
      ),
    },
    {
      accessorKey: "requester.name",
      header: "Requester",
      cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={row.original.requester.avatar} alt={row.original.requester.name} />
              <AvatarFallback className="text-[10px]">{getEmailInitials(row.original.requester.email)}</AvatarFallback>
            </Avatar>
            <span className="text-xs">{row.original.requester.name}</span>
          </div>
      ),
      meta: {
        className: "hidden md:table-cell",
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      size: 100,
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
      size: 100,
    },
    {
      accessorKey: "assignee.name",
      header: "Assignee",
      cell: ({ row }) => {
        const assignee = row.original.assignee
        return assignee ? (
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={assignee.avatar} alt={assignee.name} />
              <AvatarFallback className="text-[10px]">{getInitials(assignee.name)}</AvatarFallback>
            </Avatar>
            <span className="text-xs">{assignee.name}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        )
      },
      meta: {
        className: "hidden md:table-cell",
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => <span className="text-xs">{formatDate(row.original.createdAt)}</span>,
      meta: {
        className: "hidden lg:table-cell",
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Updated",
      cell: ({ row }) => <span className="text-xs">{formatDate(row.original.updatedAt)}</span>,
      meta: {
        className: "hidden lg:table-cell",
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
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-8 text-xs font-medium text-muted-foreground",
                        header.column.columnDef.meta?.className
                      )}
                      style={{ width: header.column.columnDef.size }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={cn(
                            "flex items-center gap-1",
                            header.column.getCanSort() && "cursor-pointer select-none"
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <div className="ml-1 flex h-4 w-4 items-center justify-center">
                              {header.column.getIsSorted() === "asc" ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronsUpDown className="h-3 w-3 opacity-50" />
                              )}
                            </div>
                          )}
                        </div>
                      )}
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
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="h-10 hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn("py-1.5 px-3", cell.column.columnDef.meta?.className)}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No tickets found.
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
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
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

function StatusBadge({ status }) {
  const statusStyles = {
    Open: "bg-blue-50 text-blue-700 border-blue-200",
    "In Progress": "bg-amber-50 text-amber-700 border-amber-200",
    Pending: "bg-purple-50 text-purple-700 border-purple-200",
    Resolved: "bg-green-50 text-green-700 border-green-200",
    Closed: "bg-gray-50 text-gray-700 border-gray-200",
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
        statusStyles[status] || "bg-gray-50 text-gray-700 border-gray-200"
      }`}
    >
      {status}
    </div>
  )
}

function PriorityBadge({ priority }) {
  const priorityStyles = {
    Urgent: "bg-red-50 text-red-700 border-red-200",
    High: "bg-orange-50 text-orange-700 border-orange-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    Low: "bg-green-50 text-green-700 border-green-200",
  }

  return (
    <div
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
        priorityStyles[priority] || "bg-gray-50 text-gray-700 border-gray-200"
      }`}
    >
      {priority}
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