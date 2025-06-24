"use client"

import { useEffect, useState, forwardRef, useImperativeHandle } from "react"
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
import { reportService } from "@/lib/services/report-service"
import { toast } from "sonner"
import { format } from "date-fns"

export const MonthlyTicketsTable = forwardRef(({ month, year }, ref) => {
    const [sorting, setSorting] = useState([])
    const [data, setData] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    
    // Expose methods to parent component via ref
    useImperativeHandle(ref, () => ({
        // Return the table data for CSV export
        getTableData: () => data
    }))

    useEffect(() => {
        const fetchMonthlyTickets = async () => {
            try {
                setIsLoading(true)
                const response = await reportService.getMonthlyTicketReport(year, month)
                
                if (response.data && response.data.tickets) {
                    // Format tickets for display
                    const formattedTickets = response.data.tickets.map(ticket => ({
                        id: ticket._id,
                        subject: ticket.subject,
                        category: ticket.category,
                        status: ticket.status,
                        priority: ticket.priority,
                        assignedTo: ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : "Unassigned",
                        responseTime: ticket.responseTime || "-",
                        createdAt: ticket.createdAt,
                    }))
                    
                    setData(formattedTickets)
                }
            } catch (error) {
                console.error("Error fetching monthly tickets:", error)
                toast.error("Failed to load ticket report data")
                
                // Fallback to generate some data if API fails
                const statuses = ["Open", "In Progress", "Pending", "Resolved", "Closed"]
                const priorities = ["Low", "Medium", "High", "Urgent"]
                const categories = ["Account Access", "Billing", "Technical Support", "Feature Request", "Bug Report"]
                const fallbackData = []

                for (let i = 1; i <= 30; i++) {
                    fallbackData.push({
                        id: `TICKET-${month}${year}-${i}`,
                        subject: `Sample Ticket ${i} for ${month + 1}/${year}`,
                        category: categories[Math.floor(Math.random() * categories.length)],
                        status: statuses[Math.floor(Math.random() * statuses.length)],
                        priority: priorities[Math.floor(Math.random() * priorities.length)],
                        assignedTo: Math.random() > 0.2 ? "John Doe" : "Unassigned",
                        responseTime: Math.floor(Math.random() * 24) + 1,
                        createdAt: new Date(year, month, Math.floor(Math.random() * 28) + 1).toISOString(),
                    })
                }
                
                setData(fallbackData)
            } finally {
                setIsLoading(false)
            }
        }
        
        fetchMonthlyTickets()
    }, [month, year])

    const columns = [
        {
            accessorKey: "id",
            header: "Ticket ID",
        },
        {
            accessorKey: "subject",
            header: "Subject",
        },
        {
            accessorKey: "category",
            header: "Category",
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status")
                return <StatusBadge status={status} />
            },
        },
        {
            accessorKey: "priority",
            header: "Priority",
            cell: ({ row }) => {
                const priority = row.getValue("priority")
                return <PriorityBadge priority={priority} />
            },
        },
        {
            accessorKey: "assignedTo",
            header: "Assigned To",
        },
        {
            accessorKey: "responseTime",
            header: "Response Time (hrs)",
        },
        {
            accessorKey: "createdAt",
            header: "Created At",
            cell: ({ row }) => {
                return <span>{formatDate(row.getValue("createdAt"))}</span>
            },
        },
    ]

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    })

    if (isLoading) {
        return (
            <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder ? null : (
                                        <Button
                                            variant="ghost"
                                            onClick={() => header.column.toggleSorting(header.column.getIsSorted() === "asc")}
                                            className="p-0 hover:bg-transparent"
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getIsSorted() === "asc" ? (
                                                <ChevronUp className="ml-1 h-3 w-3" />
                                            ) : header.column.getIsSorted() === "desc" ? (
                                                <ChevronDown className="ml-1 h-3 w-3" />
                                            ) : (
                                                <ChevronsUpDown className="ml-1 h-3 w-3" />
                                            )}
                                        </Button>
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No tickets found for this month
                            </TableCell>
                        </TableRow>
                    ) : (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            <div className="flex items-center justify-between p-4 border-t">
                <div className="text-sm text-muted-foreground">
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
})

function StatusBadge({ status }) {
    const getStatusColor = (status) => {
        switch (status) {
            case "Open":
                return "bg-blue-100 text-blue-800 hover:bg-blue-100/80"
            case "In Progress":
                return "bg-amber-100 text-amber-800 hover:bg-amber-100/80"
            case "Pending":
                return "bg-purple-100 text-purple-800 hover:bg-purple-100/80"
            case "Resolved":
                return "bg-green-100 text-green-800 hover:bg-green-100/80"
            case "Closed":
                return "bg-gray-100 text-gray-800 hover:bg-gray-100/80"
            default:
                return "bg-gray-100 text-gray-800 hover:bg-gray-100/80"
        }
    }

    return (
        <Badge variant="outline" className={`${getStatusColor(status)}`}>
            {status}
        </Badge>
    )
}

function PriorityBadge({ priority }) {
    const getPriorityColor = (priority) => {
        switch (priority) {
            case "Low":
                return "bg-green-100 text-green-800 hover:bg-green-100/80"
            case "Medium":
                return "bg-blue-100 text-blue-800 hover:bg-blue-100/80"
            case "High":
                return "bg-amber-100 text-amber-800 hover:bg-amber-100/80"
            case "Urgent":
                return "bg-red-100 text-red-800 hover:bg-red-100/80"
            default:
                return "bg-gray-100 text-gray-800 hover:bg-gray-100/80"
        }
    }

    return (
        <Badge variant="outline" className={`${getPriorityColor(priority)}`}>
            {priority}
        </Badge>
    )
}

function formatDate(dateString) {
    try {
        return format(new Date(dateString), "MMM d, yyyy")
    } catch (error) {
        return dateString
    }
}
