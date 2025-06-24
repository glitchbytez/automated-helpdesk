# Email Notification Setup Guide

This guide explains how to configure email notifications for the Campus Support System using Gmail.

## Features Implemented

The system now sends automatic email notifications for the following events:

### Ticket-Related Emails
1. **Ticket Created** - Sent to the requester when a new ticket is created
2. **Ticket Assigned** - Sent to the requester when a ticket is assigned to an agent
3. **Ticket Status Changed** - Sent to the requester when ticket status changes (Open, In Progress, Pending, Resolved, Closed)

### User-Related Emails
1. **New User Account** - Sent when a new user account is created with temporary password
2. **Password Reset (Admin)** - Sent when an admin resets a user's password
3. **Password Reset (User)** - Sent when a user successfully resets their own password

## Gmail Configuration

### Step 1: Enable App Passwords in Gmail

1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Factor Authentication if not already enabled
4. Go to "App passwords" section
5. Generate an app password for "Mail"
6. Copy the generated 16-character password

### Step 2: Environment Variables

Add the following variables to your environment file (`.env.development.local`, `.env.production.local`, etc.):

```env
# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Campus Support

# Frontend URL (for links in emails)
FRONTEND_URL=http://localhost:3000
```

### Step 3: Important Notes

- **Use App Password**: Never use your regular Gmail password. Always use the app-specific password
- **EMAIL_PASSWORD**: This should be the 16-character app password from Gmail, not your regular password
- **EMAIL_FROM**: This should match your EMAIL_USER
- **FRONTEND_URL**: Used for login links in emails

## Email Templates

The system includes professionally designed HTML email templates with:

- Responsive design that works on all devices
- Proper styling and branding
- Color-coded status and priority indicators
- Clear call-to-action buttons
- Security notices where appropriate

## Development vs Production

### Development Mode
- Emails are logged to console instead of being sent
- All email content is displayed in terminal for testing
- No actual emails are sent

### Production Mode
- Emails are sent via Gmail SMTP
- Error handling ensures application continues if email fails
- All email operations are non-blocking

## Testing Email Setup

### Test in Development
1. Set `NODE_ENV=development`
2. Create a ticket or user
3. Check console logs for email content

### Test in Production
1. Set `NODE_ENV=production`
2. Ensure all environment variables are set correctly
3. Create a test ticket or user
4. Check if emails are received

## Troubleshooting

### Common Issues

1. **"Authentication Failed"**
   - Ensure 2FA is enabled on Gmail
   - Use app password, not regular password
   - Check EMAIL_USER and EMAIL_PASSWORD are correct

2. **"Connection Timeout"**
   - Check EMAIL_HOST and EMAIL_PORT
   - Ensure firewall allows SMTP connections
   - Try EMAIL_PORT=465 with secure=true for some networks

3. **Emails Not Sending**
   - Check NODE_ENV is set to 'production'
   - Verify all environment variables are loaded
   - Check application logs for error messages

### Configuration for Other Email Providers

If you want to use a different email provider, update these settings:

```env
# For Outlook/Hotmail
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587

# For Yahoo
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587

# For custom SMTP
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_SERVICE=  # Remove this line for custom SMTP
```

## Email Content Customization

### Modifying Templates
Email templates are located in `backend/utils/email.js`. You can customize:

- Subject lines
- Email content and styling
- Color schemes
- Branding elements

### Adding New Email Types
To add new email notifications:

1. Create a new function in `backend/utils/email.js`
2. Import and call it from the appropriate controller
3. Follow the existing pattern for error handling

## Security Considerations

- App passwords are specific to applications and can be revoked
- Email content doesn't include sensitive information like full passwords
- Failed email sending doesn't break application functionality
- All email operations are logged for auditing

## Examples

### Ticket Creation Email
```
Subject: Ticket Created: TICKET-0001 - Login Issues

Dear User,

Your support ticket has been successfully created.

Ticket Details:
- Ticket ID: TICKET-0001
- Subject: Login Issues
- Priority: Medium
- Status: Open
- Created: 12/13/2024, 10:30:00 AM

[Styled HTML content with ticket details]
```

### User Account Creation Email
```
Subject: Welcome to Campus Support - Your Account Details

Dear John Doe,

Welcome to Campus Support! Your account has been created successfully.

Account Details:
- Name: John Doe
- Email: john.doe@university.edu
- Role: agent
- Team: Support
- Temporary Password: abc123XYZ

[Login button and security notice]
```

## Support

If you encounter issues with email setup:

1. Check the troubleshooting section above
2. Verify environment variables are loaded correctly
3. Test with a simple Gmail account first
4. Check application logs for detailed error messages 