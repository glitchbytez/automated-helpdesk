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
import { ChevronDown, ChevronUp, ChevronsUpDown, MoreHorizontal, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { userService } from "@/lib/services/user-service"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

export function AgentTable() {
    const [sorting, setSorting] = useState([])
    const [globalFilter, setGlobalFilter] = useState("")
    const [roleFilter, setRoleFilter] = useState("")
    const [statusFilter, setStatusFilter] = useState("")
    const [data, setData] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // Fetch agents from API
    useEffect(() => {
        const fetchAgents = async () => {
            try {
                setIsLoading(true)
                const response = await userService.getAgents()
                
                console.log("API Response:", response) // Debug log
                
                if (response.data && response.data.agents) {
                    // Format agents for display
                    const formattedAgents = response.data.agents.map(agent => ({
                        id: agent._id,
                        name: `${agent.firstName || ''} ${agent.lastName || ''}`.trim() || 'Unknown',
                        email: agent.email || '',
                        avatar: agent.avatar || "",
                        role: agent.role || 'User',
                        status: agent.status || "Active",
                        assignedTickets: agent.assignedTickets || 0,
                        lastActive: agent.lastActive || agent.updatedAt || agent.createdAt || new Date(),
                    }))
                    
                    console.log("Formatted Agents:", formattedAgents) // Debug log
                    setData(formattedAgents)
                } else {
                    console.error("Invalid response format:", response)
                    toast.error("Invalid data format received from server")
                    setData([])
                }
            } catch (error) {
                console.error("Error fetching agents:", error)
                toast.error("Failed to load agents. Please try again.")
                
                // Set empty data array on error
                setData([])
            } finally {
                setIsLoading(false)
            }
        }
        
        fetchAgents()
    }, [])

    const columns = [
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Avatar>
                        <AvatarImage src={row.original.avatar} alt={row.original.name} />
                        <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">{row.original.name}</div>
                        <div className="text-sm text-muted-foreground">{row.original.email}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-gray-100">
                    {row.original.role}
                </Badge>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status
                return (
                    <Badge
                        variant="outline"
                        className={
                            status === "Active"
                                ? "bg-green-100 text-green-800"
                                : status === "Away"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                        }
                    >
                        {status}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "assignedTickets",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent"
                >
                    Assigned Tickets
                    {column.getIsSorted() === "asc" ? (
                        <ChevronUp className="ml-1 h-3 w-3" />
                    ) : column.getIsSorted() === "desc" ? (
                        <ChevronDown className="ml-1 h-3 w-3" />
                    ) : (
                        <ChevronsUpDown className="ml-1 h-3 w-3" />
                    )}
                </Button>
            ),
            cell: ({ row }) => <div>{row.original.assignedTickets}</div>,
        },
        {
            accessorKey: "lastActive",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="p-0 hover:bg-transparent"
                >
                    Last Active
                    {column.getIsSorted() === "asc" ? (
                        <ChevronUp className="ml-1 h-3 w-3" />
                    ) : column.getIsSorted() === "desc" ? (
                        <ChevronDown className="ml-1 h-3 w-3" />
                    ) : (
                        <ChevronsUpDown className="ml-1 h-3 w-3" />
                    )}
                </Button>
            ),
            cell: ({ row }) => <div>{formatLastActive(row.original.lastActive)}</div>,
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                            <Link href={`/agents/${row.original.id}`} className="w-full">View Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Link href={`/agents/${row.original.id}/edit`} className="w-full">Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Link href={`/agents/${row.original.id}/reset-password`} className="w-full">Reset Password</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    })

    return (
        <div>
            <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Search agents..."
                        value={globalFilter ?? ""}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="h-8 w-[250px] text-xs"
                    />
                </div>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
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
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No agents found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between space-x-2 py-4">
                <div className="text-sm text-muted-foreground">
                    Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
                    {Math.min(
                        (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                        table.getFilteredRowModel().rows.length
                    )}{" "}
                    of {table.getFilteredRowModel().rows.length} agents
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

// Helper function to get initials from name
function getInitials(name) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
}

// Helper function to format last active time
function formatLastActive(dateString) {
    try {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
        return "Unknown"
    }
}
