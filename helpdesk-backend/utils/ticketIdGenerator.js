import Ticket from "../models/Ticket.model.js"

/**
 * Generate a unique ticket ID with retry logic
 * This function is used as a backup or for manual ticket ID generation
 * The main ticket ID generation happens in the Ticket model pre-save middleware
 * 
 * @param {number} retries - Number of retry attempts
 * @returns {Promise<string>} Unique ticket ID
 */
export const generateUniqueTicketId = async (retries = 5) => {
    for (let i = 0; i < retries; i++) {
        try {
            // Get current timestamp to ensure uniqueness
            const now = new Date()
            const year = now.getFullYear().toString().slice(-2)
            const month = (now.getMonth() + 1).toString().padStart(2, '0')
            const day = now.getDate().toString().padStart(2, '0')
            
            // Get count and add retry increment to prevent collisions
            const count = await Ticket.countDocuments()
            const sequentialNumber = (count + 1 + i).toString().padStart(4, '0')
            
            const ticketId = `TKT-${year}${month}${day}-${sequentialNumber}`
            
            // Check if this ID already exists
            const existing = await Ticket.findOne({ ticketId })
            if (!existing) {
                return ticketId
            }
        } catch (error) {
            console.error(`Error generating ticket ID (attempt ${i + 1}):`, error)
        }
    }
    
    // Fallback: use timestamp-based ID to ensure uniqueness
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `TKT-${timestamp}-${random}`
}

/**
 * Validate if a ticket ID format is correct
 * @param {string} ticketId - Ticket ID to validate
 * @returns {boolean} True if valid format
 */
export const isValidTicketIdFormat = (ticketId) => {
    // Format: TKT-YYMMDD-XXXX or TKT-XXXXXXXX-XXX (fallback format)
    const patterns = [
        /^TKT-\d{6}-\d{4}$/,  // Standard format: TKT-241213-0001
        /^TKT-\d{8}-\d{3}$/   // Fallback format: TKT-12345678-123
    ]
    
    return patterns.some(pattern => pattern.test(ticketId))
}

/**
 * Extract information from ticket ID
 * @param {string} ticketId - Ticket ID to parse
 * @returns {object} Parsed information or null if invalid
 */
export const parseTicketId = (ticketId) => {
    const standardMatch = ticketId.match(/^TKT-(\d{2})(\d{2})(\d{2})-(\d{4})$/)
    if (standardMatch) {
        const [, year, month, day, sequence] = standardMatch
        return {
            type: 'standard',
            year: `20${year}`,
            month,
            day,
            sequence: parseInt(sequence),
            date: new Date(2000 + parseInt(year), parseInt(month) - 1, parseInt(day))
        }
    }
    
    const fallbackMatch = ticketId.match(/^TKT-(\d{8})-(\d{3})$/)
    if (fallbackMatch) {
        const [, timestamp, random] = fallbackMatch
        return {
            type: 'fallback',
            timestamp,
            random,
            generatedAt: new Date(parseInt(timestamp + '00000')) // Convert 8-digit to timestamp
        }
    }
    
    return null
} 