import { api } from "../api"

export const requestService = {
    // Create a new request (public endpoint)
    async createRequest(requestData) {
        try {
            const response = await api.post("/requests", requestData)
            return response.data
        } catch (error) {
            console.error("Error creating request:", error)
            throw error
        }
    },

    // Get all requests with filtering and pagination (admin only)
    async getAllRequests(params = {}) {
        try {
            const queryParams = new URLSearchParams()
            
            // Add pagination parameters
            if (params.page) queryParams.append("page", params.page)
            if (params.limit) queryParams.append("limit", params.limit)
            
            // Add filtering parameters
            if (params.status) queryParams.append("status", params.status)
            if (params.type) queryParams.append("type", params.type)
            
            // Add sorting parameters
            if (params.sortBy) queryParams.append("sortBy", params.sortBy)
            if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder)

            const response = await api.get(`/requests?${queryParams.toString()}`)
            return response.data
        } catch (error) {
            console.error("Error fetching requests:", error)
            throw error
        }
    },

    // Get request by ID (admin only)
    async getRequest(id) {
        try {
            const response = await api.get(`/requests/${id}`)
            return response.data
        } catch (error) {
            console.error("Error fetching request:", error)
            throw error
        }
    },

    // Update request (admin only)
    async updateRequest(id, updateData) {
        try {
            const response = await api.patch(`/requests/${id}`, updateData)
            return response.data
        } catch (error) {
            console.error("Error updating request:", error)
            throw error
        }
    },

    // Approve request (admin only)
    async approveRequest(id, reviewNotes = "") {
        try {
            const response = await api.patch(`/requests/${id}/approve`, { reviewNotes })
            return response.data
        } catch (error) {
            console.error("Error approving request:", error)
            throw error
        }
    },

    // Reject request (admin only)
    async rejectRequest(id, reviewNotes = "") {
        try {
            const response = await api.patch(`/requests/${id}/reject`, { reviewNotes })
            return response.data
        } catch (error) {
            console.error("Error rejecting request:", error)
            throw error
        }
    },

    // Delete request (admin only)
    async deleteRequest(id) {
        try {
            const response = await api.delete(`/requests/${id}`)
            return response.data
        } catch (error) {
            console.error("Error deleting request:", error)
            throw error
        }
    },

    // Get request statistics (admin only)
    async getRequestStats() {
        try {
            const response = await api.get("/requests/stats")
            return response.data
        } catch (error) {
            console.error("Error fetching request stats:", error)
            throw error
        }
    },
} 