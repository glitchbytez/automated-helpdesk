import { api } from "../api"

/**
 * Ticket service for handling ticket operations
 */
export const ticketService = {
  /**
   * Get all tickets
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Tickets data
   */
  async getTickets(params = {}) {
    const queryParams = new URLSearchParams(params).toString()
    return api.get(`tickets${queryParams ? `?${queryParams}` : ""}`)
  },

  /**
   * Get tickets assigned to the current user
   * @returns {Promise<Object>} Tickets data
   */
  async getMyTickets() {
    return api.get("tickets/my-tickets")
  },

  /**
   * Get unassigned tickets
   * @returns {Promise<Object>} Tickets data
   */
  async getUnassignedTickets() {
    return api.get("tickets/unassigned")
  },

  /**
   * Get a ticket by ID
   * @param {string} id - Ticket ID
   * @returns {Promise<Object>} Ticket data
   */
  async getTicket(id) {
    return api.get(`tickets/${id}`)
  },

  /**
   * Create a new ticket
   * @param {Object} ticketData - Ticket data
   * @returns {Promise<Object>} Created ticket
   */
  async createTicket(ticketData) {
    return api.post("tickets", ticketData)
  },

  /**
   * Update a ticket
   * @param {string} id - Ticket ID
   * @param {Object} ticketData - Updated ticket data
   * @returns {Promise<Object>} Updated ticket
   */
  async updateTicket(id, ticketData) {
    return api.patch(`tickets/${id}`, ticketData)
  },

  /**
   * Delete a ticket
   * @param {string} id - Ticket ID
   * @returns {Promise<Object>} Response data
   */
  async deleteTicket(id) {
    return api.delete(`tickets/${id}`)
  },

  /**
   * Delete all tickets
   * @returns {Promise<Object>} Response data with deleted count
   */
  async deleteAllTickets() {
    return api.delete("tickets/all")
  },

  /**
   * Assign a ticket to an agent
   * @param {string} ticketId - Ticket ID
   * @param {string} agentId - Agent ID
   * @returns {Promise<Object>} Updated ticket
   */
  async assignTicket(ticketId, agentId) {
    return api.patch(`tickets/${ticketId}/assign`, { agentId })
  },

  /**
   * Assign a ticket to the current user
   * @param {string} ticketId - Ticket ID
   * @returns {Promise<Object>} Updated ticket
   */
  async assignToSelf(ticketId) {
    return api.patch(`tickets/${ticketId}/assign-to-self`)
  },

  /**
   * Add a message to a ticket
   * @param {string} ticketId - Ticket ID
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Updated ticket with new message
   */
  async addMessage(ticketId, messageData) {
    return api.post(`tickets/${ticketId}/messages`, messageData)
  },
  
  /**
   * Get ticket messages (email conversation)
   * @param {string} ticketId - Ticket ID
   * @returns {Promise<Object>} Ticket messages data
   */
  async getTicketMessages(ticketId) {
    return api.get(`tickets/${ticketId}/messages`)
  },
  
  /**
   * Send an email message for a ticket
   * @param {Object} emailData - Email data including ticketId, subject, message, and recipientEmail
   * @returns {Promise<Object>} Sent message data
   */
  async sendTicketMessage(emailData) {
    return api.post(`tickets/${emailData.ticketId}/email`, emailData)
  },

  /**
   * Add an internal note to a ticket
   * @param {string} ticketId - Ticket ID
   * @param {Object} noteData - Note data
   * @returns {Promise<Object>} Updated ticket with new note
   */
  async addNote(ticketId, noteData) {
    return api.post(`tickets/${ticketId}/notes`, noteData)
  },

  /**
   * Get ticket history
   * @param {string} ticketId - Ticket ID
   * @returns {Promise<Object>} Ticket history data
   */
  async getTicketHistory(ticketId) {
    return api.get(`tickets/${ticketId}/history`)
  },
}

