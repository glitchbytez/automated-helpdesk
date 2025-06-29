import nodemailer from "nodemailer"
import { 
    EMAIL_HOST, 
    EMAIL_PORT, 
    EMAIL_USER, 
    EMAIL_PASSWORD, 
    EMAIL_FROM_NAME, 
    EMAIL_FROM,
    NODE_ENV,
    FRONTEND_URL
} from "../config/env.js"

/**
 * Create nodemailer transporter
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail', // Use Gmail service
        host: EMAIL_HOST || 'smtp.gmail.com',
        port: EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASSWORD, // Use app password for Gmail
        },
    })
}

/**
 * Send an email using nodemailer
 * In development mode, emails are logged to console instead of actually being sent
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Email text content
 * @param {string} options.html - Email HTML content
 */
export const sendEmail = async (options) => {
    // Define the email options
    const mailOptions = {
        from: `${EMAIL_FROM_NAME || 'Campus Support'} <${EMAIL_FROM || EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    }

    // In development mode, just log the email instead of sending it
    if (NODE_ENV !== 'production') {
        console.log('=================== EMAIL WOULD BE SENT ===================');
        console.log('To:', options.email);
        console.log('Subject:', options.subject);
        console.log('Message:', options.message);
        console.log('HTML:', options.html);
        console.log('===========================================================');
        return; // Don't actually send the email in development
    }
    
    try {
        // Create a transporter
        const transporter = createTransporter()
        
        // Send the email
        const info = await transporter.sendMail(mailOptions)
        console.log('Email sent successfully:', info.messageId)
        return info
    } catch (error) {
        console.error('Email sending failed:', error.message);
        // Don't throw the error - we don't want user operations to fail just because email sending failed
    }
}

/**
 * Send ticket creation notification email
 * @param {Object} ticket - Ticket object
 * @param {string} requesterEmail - Requester's email
 */
export const sendTicketCreatedEmail = async (ticket, requesterEmail) => {
    const subject = `Ticket Created: ${ticket.ticketId} - ${ticket.subject}`
    
    const message = `
Dear ${ticket.requester?.name || 'User'},

Your support ticket has been successfully created.

Ticket Details:
- Ticket ID: ${ticket.ticketId}
- Subject: ${ticket.subject}
- Priority: ${ticket.priority}
- Status: ${ticket.status}
- Created: ${new Date(ticket.createdAt).toLocaleString()}

Description:
${ticket.description}

You can track your ticket status or add additional information by visiting our support chatbot.

Best regards,
Campus Support Team
    `.trim()

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Ticket Created Successfully</h2>
        
        <p>Dear ${ticket.requester?.name || 'User'},</p>
        
        <p>Your support ticket has been successfully created.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Ticket Details</h3>
            <ul style="list-style: none; padding: 0;">
                <li><strong>Ticket ID:</strong> ${ticket.ticketId}</li>
                <li><strong>Subject:</strong> ${ticket.subject}</li>
                <li><strong>Priority:</strong> <span style="color: ${getPriorityColor(ticket.priority)};">${ticket.priority}</span></li>
                <li><strong>Status:</strong> <span style="color: ${getStatusColor(ticket.status)};">${ticket.status}</span></li>
                <li><strong>Created:</strong> ${new Date(ticket.createdAt).toLocaleString()}</li>
            </ul>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0;">Description:</h4>
            <p>${ticket.description}</p>
        </div>
        
        <p>You can track your ticket status or add additional information by visiting our support chatbot.</p>
        
        <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>Campus Support Team</strong>
        </p>
    </div>
    `

    await sendEmail({
        email: requesterEmail,
        subject,
        message,
        html
    })
}

/**
 * Send ticket assignment notification email
 * @param {Object} ticket - Ticket object with populated assignee
 * @param {string} requesterEmail - Requester's email
 */
export const sendTicketAssignedEmail = async (ticket, requesterEmail) => {
    const subject = `Ticket Assigned: ${ticket.ticketId} - ${ticket.subject}`
    
    const assigneeName = ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : 'Support Agent'
    
    const message = `
Dear ${ticket.requester?.name || 'User'},

Your support ticket has been assigned to one of our agents.

Ticket Details:
- Ticket ID: ${ticket.ticketId}
- Subject: ${ticket.subject}
- Assigned to: ${assigneeName}
- Priority: ${ticket.priority}
- Status: ${ticket.status}

Your ticket is now being reviewed by our support team. You should expect a response soon.

Best regards,
Campus Support Team
    `.trim()

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Ticket Assigned</h2>
        
        <p>Dear ${ticket.requester?.name || 'User'},</p>
        
        <p>Your support ticket has been assigned to one of our agents.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Ticket Details</h3>
            <ul style="list-style: none; padding: 0;">
                <li><strong>Ticket ID:</strong> ${ticket.ticketId}</li>
                <li><strong>Subject:</strong> ${ticket.subject}</li>
                <li><strong>Assigned to:</strong> ${assigneeName}</li>
                <li><strong>Priority:</strong> <span style="color: ${getPriorityColor(ticket.priority)};">${ticket.priority}</span></li>
                <li><strong>Status:</strong> <span style="color: ${getStatusColor(ticket.status)};">${ticket.status}</span></li>
            </ul>
        </div>
        
        <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>✓ Good news!</strong> Your ticket is now being reviewed by our support team. You should expect a response soon.</p>
        </div>
        
        <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>Campus Support Team</strong>
        </p>
    </div>
    `

    await sendEmail({
        email: requesterEmail,
        subject,
        message,
        html
    })
}

/**
 * Send ticket status change notification email
 * @param {Object} ticket - Ticket object
 * @param {string} requesterEmail - Requester's email
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 */
export const sendTicketStatusChangedEmail = async (ticket, requesterEmail, oldStatus, newStatus) => {
    const subject = `Ticket ${newStatus}: ${ticket.ticketId} - ${ticket.subject}`
    
    let statusMessage = ''
    let statusColor = getStatusColor(newStatus)
    
    switch (newStatus.toLowerCase()) {
        case 'closed':
        case 'resolved':
            statusMessage = 'Your ticket has been resolved and closed. If you need further assistance, please create a new ticket.'
            break
        case 'in progress':
            statusMessage = 'Our support team is actively working on your ticket.'
            break
        case 'pending':
            statusMessage = 'Your ticket is pending additional information or external dependencies.'
            break
        default:
            statusMessage = `Your ticket status has been updated to ${newStatus}.`
    }
    
    const message = `
Dear ${ticket.requester?.name || 'User'},

Your support ticket status has been updated.

Ticket Details:
- Ticket ID: ${ticket.ticketId}
- Subject: ${ticket.subject}
- Previous Status: ${oldStatus}
- New Status: ${newStatus}
- Priority: ${ticket.priority}

${statusMessage}

Best regards,
Campus Support Team
    `.trim()

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Ticket Status Updated</h2>
        
        <p>Dear ${ticket.requester?.name || 'User'},</p>
        
        <p>Your support ticket status has been updated.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Ticket Details</h3>
            <ul style="list-style: none; padding: 0;">
                <li><strong>Ticket ID:</strong> ${ticket.ticketId}</li>
                <li><strong>Subject:</strong> ${ticket.subject}</li>
                <li><strong>Previous Status:</strong> <span style="color: ${getStatusColor(oldStatus)};">${oldStatus}</span></li>
                <li><strong>New Status:</strong> <span style="color: ${statusColor};">${newStatus}</span></li>
                <li><strong>Priority:</strong> <span style="color: ${getPriorityColor(ticket.priority)};">${ticket.priority}</span></li>
            </ul>
        </div>
        
        <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;">${statusMessage}</p>
        </div>
        
        <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>Campus Support Team</strong>
        </p>
    </div>
    `

    await sendEmail({
        email: requesterEmail,
        subject,
        message,
        html
    })
}

/**
 * Send new user account creation email
 * @param {Object} user - User object
 * @param {string} temporaryPassword - Temporary password
 */
export const sendUserCreatedEmail = async (user, temporaryPassword) => {
    const subject = "Welcome to Campus Support - Your Account Details"
    
    const loginUrl = FRONTEND_URL ? `${FRONTEND_URL}/login` : '#'
    
    const message = `
Dear ${user.firstName} ${user.lastName},

Welcome to Campus Support! Your account has been created successfully.

Account Details:
- Name: ${user.firstName} ${user.lastName}
- Email: ${user.email}
- Role: ${user.role}
- Team: ${user.team || 'Support'}
- Temporary Password: ${temporaryPassword}

Important: Please log in and change your password immediately for security purposes.

Login URL: ${loginUrl}

Best regards,
Campus Support Team
    `.trim()

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Campus Support!</h2>
        
        <p>Dear ${user.firstName} ${user.lastName},</p>
        
        <p>Welcome to Campus Support! Your account has been created successfully.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Account Details</h3>
            <ul style="list-style: none; padding: 0;">
                <li><strong>Name:</strong> ${user.firstName} ${user.lastName}</li>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Role:</strong> ${user.role}</li>
                <li><strong>Team:</strong> ${user.team || 'Support'}</li>
                <li><strong>Temporary Password:</strong> <code style="background-color: #e8e8e8; padding: 2px 6px; border-radius: 3px;">${temporaryPassword}</code></li>
            </ul>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0;"><strong>⚠️ Important:</strong> Please log in and change your password immediately for security purposes.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Your Account</a>
        </div>
        
        <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>Campus Support Team</strong>
        </p>
    </div>
    `

    await sendEmail({
        email: user.email,
        subject,
        message,
        html
    })
}

/**
 * Send password reset notification email
 * @param {Object} user - User object
 * @param {string} newPassword - New password (optional, for admin resets)
 * @param {boolean} isAdminReset - Whether this is an admin-initiated reset
 */
export const sendPasswordResetEmail = async (user, newPassword = null, isAdminReset = false) => {
    const subject = isAdminReset ? "Your Password Has Been Reset" : "Password Reset Confirmation"
    
    const loginUrl = FRONTEND_URL ? `${FRONTEND_URL}/login` : '#'
    
    let message = `
Dear ${user.firstName} ${user.lastName},

Your password has been ${isAdminReset ? 'reset by an administrator' : 'successfully reset'}.
    `
    
    if (isAdminReset && newPassword) {
        message += `

New Password: ${newPassword}

Important: Please log in and change your password immediately for security purposes.
        `
    }
    
    message += `

If you did not request this password reset, please contact support immediately.

Login URL: ${loginUrl}

Best regards,
Campus Support Team
    `.trim()

    let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Confirmation</h2>
        
        <p>Dear ${user.firstName} ${user.lastName},</p>
        
        <p>Your password has been ${isAdminReset ? 'reset by an administrator' : 'successfully reset'}.</p>
    `
    
    if (isAdminReset && newPassword) {
        html += `
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">New Password</h3>
            <p><code style="background-color: #e8e8e8; padding: 6px 12px; border-radius: 3px; font-size: 16px;">${newPassword}</code></p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0;"><strong>⚠️ Important:</strong> Please log in and change your password immediately for security purposes.</p>
        </div>
        `
    }
    
    html += `
        <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <p style="margin: 0;"><strong>🔒 Security Notice:</strong> If you did not request this password reset, please contact support immediately.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Your Account</a>
        </div>
        
        <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>Campus Support Team</strong>
        </p>
    </div>
    `

    await sendEmail({
        email: user.email,
        subject,
        message,
        html
    })
}

/**
 * Helper function to get priority color
 * @param {string} priority - Priority level
 * @returns {string} Color code
 */
const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
        case 'urgent': return '#dc3545'
        case 'high': return '#fd7e14'
        case 'medium': return '#ffc107'
        case 'low': return '#28a745'
        default: return '#6c757d'
    }
}

/**
 * Helper function to get status color
 * @param {string} status - Status
 * @returns {string} Color code
 */
const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'open': return '#007bff'
        case 'in progress': return '#fd7e14'
        case 'pending': return '#ffc107'
        case 'resolved': return '#28a745'
        case 'closed': return '#6c757d'
        default: return '#6c757d'
    }
} 