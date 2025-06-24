"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { 
    Search, 
    Filter, 
    Eye, 
    Check, 
    X, 
    Trash2, 
    Clock, 
    User, 
    Key,
    RefreshCw,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import { requestService } from "@/lib/services/request-service"
import { showToast } from "@/lib/utils/toast-helper"
import { AdminRouteProtection } from "@/components/admin-route-protection"

export default function RequestsPage() {
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [typeFilter, setTypeFilter] = useState("all")
    const [selectedRequest, setSelectedRequest] = useState(null)
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
    const [isActionDialogOpen, setIsActionDialogOpen] = useState(false)
    const [actionType, setActionType] = useState("") // "approve" or "reject"
    const [reviewNotes, setReviewNotes] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [requestToDelete, setRequestToDelete] = useState(null)
    const [stats, setStats] = useState({
        pendingCount: 0,
        totalCount: 0,
        statusStats: [],
        typeStats: []
    })
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [itemsPerPage] = useState(10)

    useEffect(() => {
        fetchRequests()
        fetchStats()
    }, [currentPage, statusFilter, typeFilter, searchTerm])



    const fetchRequests = async () => {
        try {
            setLoading(true)
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                sortBy: "createdAt",
                sortOrder: "desc"
            }
            
            if (statusFilter !== "all") params.status = statusFilter
            if (typeFilter !== "all") params.type = typeFilter
            
            const response = await requestService.getAllRequests(params)
            
            // Handle different response structures - the API sometimes returns the data directly
            // or nested in a data property depending on response transformations
            let requestsData = []
            if (response.data && response.data.requests) {
                // Standard structure: { data: { requests: [...] } }
                requestsData = response.data.requests
            } else if (response.requests) {
                // Transformed structure: { requests: [...] }
                requestsData = response.requests
            } else {
                requestsData = []
            }
            
            setRequests(requestsData)
            setTotalPages(response.totalPages || 1)
        } catch (error) {
            console.error("Error fetching requests:", error)
            showToast.error("Failed to fetch requests")
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await requestService.getRequestStats()
            
            // Handle different response structures like we did for requests
            let statsData = {}
            if (response.data) {
                // Standard structure: { data: { ... } }
                statsData = response.data
            } else if (response.statusStats || response.typeStats || response.pendingCount !== undefined || response.totalCount !== undefined) {
                // Transformed structure: stats are directly in the response
                statsData = response
            } else {
                statsData = {
                    pendingCount: 0,
                    totalCount: 0,
                    statusStats: [],
                    typeStats: []
                }
            }
            
            setStats(statsData)
        } catch (error) {
            console.error("Error fetching stats:", error)
            setStats({
                pendingCount: 0,
                totalCount: 0,
                statusStats: [],
                typeStats: []
            })
        }
    }

    const handleViewRequest = (request) => {
        setSelectedRequest(request)
        setIsDetailDialogOpen(true)
    }

    const handleActionRequest = (request, action) => {
        setSelectedRequest(request)
        setActionType(action)
        setReviewNotes("")
        setIsActionDialogOpen(true)
    }

    const handleSubmitAction = async () => {
        if (!selectedRequest) return

        setIsSubmitting(true)
        try {
            if (actionType === "approve") {
                await requestService.approveRequest(selectedRequest._id, reviewNotes)
                showToast.success("Request approved successfully")
            } else if (actionType === "reject") {
                await requestService.rejectRequest(selectedRequest._id, reviewNotes)
                showToast.success("Request rejected")
            }
            
            setIsActionDialogOpen(false)
            fetchRequests()
            fetchStats()
        } catch (error) {
            console.error("Error processing request:", error)
            showToast.error(error?.response?.data?.message || "Failed to process request")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteRequest = async () => {
        if (!requestToDelete) return

        try {
            await requestService.deleteRequest(requestToDelete._id)
            showToast.success("Request deleted successfully")
            setDeleteConfirmOpen(false)
            setRequestToDelete(null)
            fetchRequests()
            fetchStats()
        } catch (error) {
            console.error("Error deleting request:", error)
            showToast.error("Failed to delete request")
        }
    }

    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case "pending": return "default"
            case "approved": return "secondary"
            case "rejected": return "destructive"
            default: return "default"
        }
    }

    const getTypeBadgeVariant = (type) => {
        switch (type) {
            case "account_opening": return "default"
            case "password_reset": return "secondary"
            default: return "default"
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    const filteredRequests = (requests || []).filter(request => {
        if (!request) return false
        const matchesSearch = searchTerm === "" || 
            (request.requesterName && request.requesterName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (request.requesterEmail && request.requesterEmail.toLowerCase().includes(searchTerm.toLowerCase()))
        return matchesSearch
    })



    return (
        <AdminRouteProtection>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Requests Management</h1>
                        <p className="text-muted-foreground">
                            Manage account opening and password reset requests
                        </p>
                    </div>
                    <Button onClick={fetchRequests} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <Clock className="h-5 w-5 text-orange-500" />
                                <div>
                                    <p className="text-sm font-medium">Pending</p>
                                    <p className="text-2xl font-bold">{stats?.pendingCount || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <User className="h-5 w-5 text-blue-500" />
                                <div>
                                    <p className="text-sm font-medium">Account Requests</p>
                                    <p className="text-2xl font-bold">
                                        {stats?.typeStats?.find(s => s._id === "account_opening")?.count || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <Key className="h-5 w-5 text-green-500" />
                                <div>
                                    <p className="text-sm font-medium">Password Resets</p>
                                    <p className="text-2xl font-bold">
                                        {stats?.typeStats?.find(s => s._id === "password_reset")?.count || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <div className="h-5 w-5 rounded-full bg-gradient-to-r from-blue-500 to-green-500" />
                                <div>
                                    <p className="text-sm font-medium">Total Requests</p>
                                    <p className="text-2xl font-bold">{stats?.totalCount || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="account_opening">Account Opening</SelectItem>
                                    <SelectItem value="password_reset">Password Reset</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Requests Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Requests ({filteredRequests.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <RefreshCw className="h-6 w-6 animate-spin" />
                                <span className="ml-2">Loading requests...</span>
                            </div>
                        ) : filteredRequests.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No requests found
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Requester</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRequests.map((request) => (
                                            <TableRow key={request._id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{request.requesterName}</div>
                                                        <div className="text-sm text-muted-foreground">{request.requesterEmail}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getTypeBadgeVariant(request.type)}>
                                                        {request.type === "account_opening" ? "Account Opening" : "Password Reset"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(request.status)}>
                                                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{formatDate(request.createdAt)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleViewRequest(request)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {request.status === "pending" && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleActionRequest(request, "approve")}
                                                                    className="text-green-600 hover:text-green-700"
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleActionRequest(request, "reject")}
                                                                    className="text-red-600 hover:text-red-700"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setRequestToDelete(request)
                                                                setDeleteConfirmOpen(true)
                                                            }}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Page {currentPage} of {totalPages}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Request Detail Dialog */}
                <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Request Details</DialogTitle>
                        </DialogHeader>
                        {selectedRequest && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium">Type</Label>
                                        <p className="mt-1">
                                            <Badge variant={getTypeBadgeVariant(selectedRequest.type)}>
                                                {selectedRequest.type === "account_opening" ? "Account Opening" : "Password Reset"}
                                            </Badge>
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Status</Label>
                                        <p className="mt-1">
                                            <Badge variant={getStatusBadgeVariant(selectedRequest.status)}>
                                                {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                                            </Badge>
                                        </p>
                                    </div>
                                </div>
                                
                                <div>
                                    <Label className="text-sm font-medium">Requester Information</Label>
                                    <div className="mt-2 space-y-2">
                                        <p><strong>Name:</strong> {selectedRequest.requesterName}</p>
                                        <p><strong>Email:</strong> {selectedRequest.requesterEmail}</p>
                                        {selectedRequest.requesterPhone && (
                                            <p><strong>Phone:</strong> {selectedRequest.requesterPhone}</p>
                                        )}
                                        {selectedRequest.department && (
                                            <p><strong>Department:</strong> {selectedRequest.department}</p>
                                        )}
                                        {selectedRequest.jobTitle && (
                                            <p><strong>Job Title:</strong> {selectedRequest.jobTitle}</p>
                                        )}
                                    </div>
                                </div>

                                {selectedRequest.type === "account_opening" && (
                                    <div>
                                        <Label className="text-sm font-medium">Requested Access</Label>
                                        <div className="mt-2 space-y-2">
                                            <p><strong>Role:</strong> {selectedRequest.requestedRole}</p>
                                            <p><strong>Team:</strong> {selectedRequest.requestedTeam}</p>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <Label className="text-sm font-medium">Reason</Label>
                                    <p className="mt-1 p-3 bg-muted rounded-md">{selectedRequest.reason}</p>
                                </div>

                                <div>
                                    <Label className="text-sm font-medium">Request Details</Label>
                                    <div className="mt-2 space-y-2">
                                        <p><strong>Submitted:</strong> {formatDate(selectedRequest.createdAt)}</p>
                                        {selectedRequest.reviewedAt && (
                                            <p><strong>Reviewed:</strong> {formatDate(selectedRequest.reviewedAt)}</p>
                                        )}
                                        {selectedRequest.reviewedBy && (
                                            <p><strong>Reviewed by:</strong> {selectedRequest.reviewedBy.firstName} {selectedRequest.reviewedBy.lastName}</p>
                                        )}
                                    </div>
                                </div>

                                {selectedRequest.reviewNotes && (
                                    <div>
                                        <Label className="text-sm font-medium">Review Notes</Label>
                                        <p className="mt-1 p-3 bg-muted rounded-md">{selectedRequest.reviewNotes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Action Dialog */}
                <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {actionType === "approve" ? "Approve Request" : "Reject Request"}
                            </DialogTitle>
                            <DialogDescription>
                                {actionType === "approve" 
                                    ? "Are you sure you want to approve this request? This action will process the request immediately."
                                    : "Are you sure you want to reject this request? Please provide a reason."
                                }
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="reviewNotes">
                                    {actionType === "approve" ? "Notes (optional)" : "Reason for rejection *"}
                                </Label>
                                <Textarea
                                    id="reviewNotes"
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder={actionType === "approve" 
                                        ? "Add any notes about this approval..."
                                        : "Please explain why this request is being rejected..."
                                    }
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsActionDialogOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmitAction}
                                disabled={isSubmitting || (actionType === "reject" && !reviewNotes.trim())}
                                variant={actionType === "approve" ? "default" : "destructive"}
                            >
                                {isSubmitting ? (
                                    <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    actionType === "approve" ? "Approve" : "Reject"
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Request</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete this request? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteRequest} className="bg-red-600 hover:bg-red-700">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AdminRouteProtection>
    )
} 