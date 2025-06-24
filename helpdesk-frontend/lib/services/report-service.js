import { api } from "../api"

/**
 * Report service for handling report operations
 */
export const reportService = {
  /**
   * Get ticket statistics
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Ticket statistics
   */
  async getTicketStats(params = {}) {
    const queryParams = new URLSearchParams(params).toString()
    return api.get(`reports/ticket-stats${queryParams ? `?${queryParams}` : ""}`)
  },

  /**
   * Get ticket metrics (status and priority distribution)
   * @returns {Promise<Object>} Ticket metrics data
   */
  async getTicketMetrics() {
    // Ensure we're using the correct endpoint and log the request for debugging
    console.log('Calling API endpoint: reports/ticket-metrics')
    return api.get("reports/ticket-metrics")
  },

  /**
   * Get agent performance metrics
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Agent performance data
   */
  async getAgentPerformance(params = {}) {
    const queryParams = new URLSearchParams(params).toString()
    return api.get(`reports/agent-performance${queryParams ? `?${queryParams}` : ""}`)
  },

  /**
   * Get monthly ticket report
   * @param {number} year - Year
   * @param {number} month - Month
   * @returns {Promise<Object>} Monthly ticket data
   */
  async getMonthlyTicketReport(year, month) {
    return api.get(`reports/monthly-tickets/${year}/${month}`)
  },

  /**
   * Get response time metrics
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Response time data
   */
  async getResponseTimeMetrics(params = {}) {
    const queryParams = new URLSearchParams(params).toString()
    return api.get(`reports/response-time-metrics${queryParams ? `?${queryParams}` : ""}`)
  },
  
  /**
   * Get agent metrics for dashboard
   * @returns {Promise<Object>} Agent metrics data
   */
  async getAgentMetrics() {
    return api.get("reports/agent-performance")
  },

  /**
   * Get knowledge base usage statistics
   * @returns {Promise<Object>} Knowledge base usage data
   */
  async getKnowledgeBaseStats() {
    return api.get("reports/knowledge-base-stats")
  },
  
  /**
   * Get ticket volume report data
   * @param {Object} params - Query parameters (startDate, endDate)
   * @returns {Promise<Object>} Ticket volume data
   */
  async getTicketVolumeReport(params = {}) {
    const queryParams = new URLSearchParams(params).toString()
    return api.get(`reports/ticket-volume${queryParams ? `?${queryParams}` : ""}`)
  },
}
