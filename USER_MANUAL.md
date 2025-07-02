# 📖 Campus Support Helpdesk System - User Manual

<div align="center">

![User Manual](https://img.shields.io/badge/User-Manual-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0-green?style=for-the-badge)

**Complete guide to using the Campus Support Helpdesk System**

</div>

---

## 📋 Table of Contents

1. [Getting Started](#-getting-started)
2. [User Roles & Permissions](#-user-roles--permissions)
3. [Helpdesk Dashboard](#-helpdesk-dashboard)
4. [AI Chatbot Interface](#-ai-chatbot-interface)
5. [Ticket Management](#-ticket-management)
6. [Knowledge Base](#-knowledge-base)
7. [User Management](#-user-management)
8. [Reports & Analytics](#-reports--analytics)
9. [Settings & Configuration](#-settings--configuration)
10. [Mobile Usage](#-mobile-usage)
11. [Troubleshooting](#-troubleshooting)
12. [Frequently Asked Questions](#-frequently-asked-questions)

---

## 🚀 Getting Started

### System Access

The Campus Support Helpdesk System consists of two main interfaces:

| Interface | URL | Purpose |
|-----------|-----|---------|
| **Helpdesk Dashboard** | http://localhost:3001 | Main management interface |
| **AI Chatbot** | http://localhost:3000 | Interactive support chat |

### First Time Login

1. **Access the Dashboard**: Navigate to http://localhost:3001
2. **Login**: Use your provided credentials
3. **Complete Profile**: Fill in your profile information
4. **Explore Interface**: Familiarize yourself with the navigation

### Default Accounts

For initial setup, the following default accounts are available:

| Role | Email | Password | Access Level |
|------|--------|----------|--------------|
| **Admin** | admin@example.com | admin123 | Full system access |
| **Agent** | agent@example.com | agent123 | Ticket management |
| **User** | user@example.com | user123 | Create tickets only |

> ⚠️ **Security Note**: Change default passwords immediately after first login!

---

## 👥 User Roles & Permissions

### 🔴 Administrator

**Full system access with all permissions:**

✅ **User Management**
- Create, edit, and delete user accounts
- Assign and modify user roles
- Reset user passwords
- View user activity logs

✅ **Ticket Management**
- View all tickets system-wide
- Assign tickets to agents
- Modify ticket priorities and statuses
- Delete tickets when necessary

✅ **System Configuration**
- Manage system settings
- Configure email notifications
- Manage knowledge base content
- Access reports and analytics

✅ **Agent Management**
- Create and manage agent accounts
- Assign permissions to agents
- Monitor agent performance

### 🟡 Agent

**Support staff with ticket handling permissions:**

✅ **Ticket Handling**
- View assigned tickets
- Update ticket status and priority
- Add internal notes and comments
- Communicate with ticket creators

✅ **Knowledge Base**
- View knowledge base articles
- Suggest content updates
- Access internal documentation

✅ **Limited Reporting**
- View personal performance metrics
- Access assigned ticket reports

❌ **Restricted Access**
- Cannot manage other users
- Cannot access system settings
- Cannot delete tickets

### 🟢 User (Customer)

**Basic access for creating and tracking support requests:**

✅ **Ticket Creation**
- Create new support tickets
- Upload attachments to tickets
- View own ticket history

✅ **Ticket Tracking**
- Monitor ticket status updates
- Receive email notifications
- Add comments to own tickets

✅ **Chatbot Access**
- Use AI chatbot for instant support
- Get automated responses
- Escalate to human agents

❌ **Restricted Access**
- Cannot view other users' tickets
- Cannot access administrative functions
- Cannot assign tickets

---

## 🏠 Helpdesk Dashboard

### Navigation Overview

The dashboard consists of several key sections:

#### **Header Navigation**
- **🏠 Dashboard**: System overview and metrics
- **🎫 Tickets**: Ticket management interface
- **👥 Agents**: Agent management (Admin only)
- **📚 Knowledge Base**: Document management
- **📊 Reports**: Analytics and reporting
- **⚙️ Settings**: System configuration

#### **Sidebar Menu**
- **📋 My Tickets**: Your assigned/created tickets
- **📥 Unassigned**: Tickets awaiting assignment
- **🆕 New Ticket**: Create new support request
- **🔔 Notifications**: System alerts

### Dashboard Overview

#### **Quick Stats Cards**
- **Total Tickets**: Overall ticket count
- **Open Tickets**: Currently active tickets
- **Resolved Today**: Daily resolution count
- **Average Response Time**: Performance metric

#### **Recent Activity**
- Latest ticket updates
- Recent agent actions
- System notifications
- User activity feed

#### **Performance Charts**
- Ticket volume over time
- Resolution time trends
- Agent performance metrics
- Customer satisfaction scores

---

## 🎫 Ticket Management

### Creating a New Ticket

#### **Step 1: Access Ticket Creation**
1. Click **"New Ticket"** in the sidebar
2. Or use the **"+ Create Ticket"** button

#### **Step 2: Fill Ticket Details**

**Required Information:**
- **Title**: Brief, descriptive summary
- **Description**: Detailed explanation of the issue
- **Priority**: Low, Medium, High, Critical
- **Category**: Select appropriate category
- **Contact Email**: Your email address

**Optional Information:**
- **Attachments**: Screenshots, documents, logs
- **Due Date**: When resolution is needed
- **Department**: Relevant department/team

#### **Step 3: Submit and Track**
1. Review all information
2. Click **"Submit Ticket"**
3. Note the ticket ID for tracking
4. Monitor updates via email/dashboard

### Ticket Status Workflow

The ticket follows this lifecycle:

1. **New** → **Open** → **In Progress** → **Resolved** → **Closed**

#### **Status Definitions**

| Status | Description | Who Can Set |
|--------|-------------|-------------|
| **New** | Just created, awaiting review | System |
| **Open** | Acknowledged, awaiting assignment | Agent/Admin |
| **In Progress** | Actively being worked on | Agent |
| **Pending** | Waiting for customer response | Agent |
| **Resolved** | Solution provided | Agent |
| **Closed** | Ticket completed | Customer/Admin |
| **Cancelled** | Ticket withdrawn | Customer/Admin |

---

## 🤖 AI Chatbot Interface

### Accessing the Chatbot

1. **Direct Access**: Navigate to http://localhost:3000
2. **Embedded Chat**: Available within the dashboard
3. **Mobile App**: Use mobile-responsive interface

### Chatbot Capabilities

#### **🔍 Instant Support**
- Password reset guidance
- Account troubleshooting
- FAQ responses
- System status updates

#### **🎫 Ticket Creation**
The bot can create tickets directly:
1. Describe your issue to the bot
2. Bot gathers necessary information
3. Ticket is created automatically
4. You receive confirmation with ticket ID

#### **📚 Knowledge Base Search**
- Search through documentation
- Get relevant articles
- Access troubleshooting guides
- Find step-by-step instructions

#### **🤝 Human Handoff**
When the bot can't help:
1. Bot recognizes limitation
2. Offers to connect with human agent
3. Transfers conversation context
4. Agent continues seamlessly

---

## 📚 Knowledge Base

### Accessing the Knowledge Base

#### **From Dashboard**
1. Click **"Knowledge Base"** in main navigation
2. Browse categories or search articles
3. Access internal documentation (agents/admins)

#### **From Chatbot**
1. Ask the bot for help
2. Bot searches knowledge base automatically
3. Relevant articles are suggested

### Content Organization

#### **📁 Categories**
- **Account Management**: Login, passwords, profiles
- **Technical Support**: Software, hardware issues
- **Course Registration**: Enrollment, schedules
- **Billing & Payments**: Fees, financial aid
- **General Information**: Policies, procedures

#### **📄 Article Types**
- **How-to Guides**: Step-by-step instructions
- **FAQs**: Common questions and answers
- **Troubleshooting**: Problem resolution
- **Policies**: Official procedures and rules

### Using the Knowledge Base

#### **🔍 Searching Articles**
1. Use the search bar at the top
2. Enter keywords related to your issue
3. Browse search results
4. Click on relevant articles

#### **📂 Browsing Categories**
1. Select a category from the menu
2. View subcategories if available
3. Browse article listings
4. Filter by popularity or date

#### **⭐ Rating Articles**
- Rate articles as helpful or not
- Provide feedback for improvements
- Suggest new content topics

### For Administrators

#### **📝 Content Management**
- Create new articles
- Edit existing content
- Organize categories
- Monitor article performance

#### **📊 Analytics**
- Track article views
- Monitor search queries
- Identify content gaps
- Measure user satisfaction

---

## 👥 User Management

### Managing Your Profile

#### **Accessing Profile Settings**
1. Click your avatar in the top-right corner
2. Select **"Profile Settings"**
3. Update your information
4. Save changes

#### **Profile Information**
- **Personal Details**: Name, email, phone
- **Preferences**: Notifications, language
- **Security**: Password, two-factor authentication
- **Department**: Work location, team

### For Administrators

#### **Creating User Accounts**

**Step 1: Navigate to User Management**
1. Go to **"Agents"** or **"Users"** section
2. Click **"Add New User"**

**Step 2: Enter User Details**
- **Basic Information**: Name, email, phone
- **Role Assignment**: Admin, Agent, or User
- **Department**: Assign to appropriate team
- **Permissions**: Set specific access rights

**Step 3: Account Activation**
1. Send welcome email with login details
2. User sets up password on first login
3. Verify account activation

#### **Managing Existing Users**

**✏️ Editing Users**
- Update contact information
- Change role assignments
- Modify permissions
- Reset passwords

**🔒 Account Security**
- Monitor login activity
- Enforce password policies
- Enable/disable accounts
- Audit user actions

**📊 User Analytics**
- Track user activity
- Monitor ticket creation patterns
- Analyze support usage
- Generate user reports

---

## 📊 Reports & Analytics

### Available Reports

#### **📈 Ticket Analytics**
- **Volume Reports**: Tickets created over time
- **Resolution Reports**: Average resolution times
- **Priority Analysis**: Distribution by priority level
- **Category Breakdown**: Issues by type

#### **👤 Agent Performance**
- **Individual Metrics**: Tickets per agent
- **Response Times**: Average first response
- **Resolution Rates**: Successful closures
- **Customer Satisfaction**: Feedback scores

#### **📋 System Overview**
- **Dashboard Metrics**: Key performance indicators
- **Trend Analysis**: Month-over-month comparisons
- **Capacity Planning**: Resource utilization
- **Customer Insights**: User behavior patterns

### Generating Reports

#### **Standard Reports**
1. Navigate to **"Reports"** section
2. Select report type
3. Choose date range
4. Apply filters if needed
5. Generate and view results

#### **Custom Reports**
1. Click **"Create Custom Report"**
2. Select data sources
3. Choose metrics and dimensions
4. Set filters and parameters
5. Save and schedule report

#### **Exporting Data**
- **PDF Reports**: Formatted for presentation
- **Excel Exports**: Raw data for analysis
- **CSV Files**: Data import/export
- **Email Delivery**: Scheduled reports

### Key Metrics Explained

#### **📊 Performance Indicators**

| Metric | Description | Target |
|--------|-------------|---------|
| **First Response Time** | Time to initial agent response | < 2 hours |
| **Resolution Time** | Time to close ticket | < 24 hours |
| **Customer Satisfaction** | User rating of support quality | > 4.0/5.0 |
| **Resolution Rate** | % of tickets successfully resolved | > 95% |
| **Reopened Tickets** | % of tickets reopened | < 5% |

#### **📈 Trending Analysis**
- **Volume Trends**: Identify peak support times
- **Category Trends**: Popular issue types
- **Satisfaction Trends**: Service quality over time
- **Efficiency Trends**: Agent productivity

---

## ⚙️ Settings & Configuration

### Personal Settings

#### **🔔 Notification Preferences**
- **Email Notifications**: Ticket updates, mentions
- **Browser Notifications**: Real-time alerts
- **SMS Alerts**: Critical notifications (if enabled)
- **Frequency**: Immediate, daily digest, weekly summary

#### **🎨 Interface Customization**
- **Theme**: Light or dark mode
- **Language**: Preferred language setting
- **Time Zone**: Local time display
- **Dashboard Layout**: Customize widget placement

### System Settings (Admin Only)

#### **🏢 Organization Configuration**
- **Company Information**: Name, logo, contact details
- **Business Hours**: Support availability times
- **Holidays**: Non-working days
- **Time Zones**: Multi-location support

#### **📧 Email Configuration**
- **SMTP Settings**: Email server configuration
- **Templates**: Customize email notifications
- **Signatures**: Automatic email signatures
- **Branding**: Company logos and colors

#### **🔐 Security Settings**
- **Password Policies**: Complexity requirements
- **Session Management**: Timeout settings
- **Two-Factor Authentication**: Enable/disable 2FA
- **API Access**: Configure integrations

#### **🤖 Chatbot Configuration**
- **AI Training**: Update bot responses
- **Knowledge Base**: Connect to documentation
- **Escalation Rules**: When to transfer to humans
- **Operating Hours**: Bot availability times

---

## 📱 Mobile Usage

### Mobile Access

#### **📱 Responsive Web Interface**
- Access via mobile browser
- Optimized for touch interaction
- Full functionality on mobile devices
- Automatic responsive design

#### **💻 Key Mobile Features**
- ✅ Create and view tickets
- ✅ Receive push notifications
- ✅ Use chatbot interface
- ✅ Upload photos from camera
- ✅ Offline ticket drafts

### Mobile Best Practices

#### **📞 Creating Tickets on Mobile**
1. Use voice-to-text for descriptions
2. Take photos of issues directly
3. Use location services when relevant
4. Save drafts for later completion

#### **🔔 Managing Notifications**
- Enable critical alerts only
- Set quiet hours for notifications
- Use notification categories
- Customize ringtones/vibrations

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### **🚫 Login Problems**

**Issue**: Cannot log into the system
**Solutions**:
1. Check username/email spelling
2. Verify password (case-sensitive)
3. Clear browser cache and cookies
4. Try incognito/private browsing mode
5. Contact administrator for password reset

**Issue**: "Session expired" errors
**Solutions**:
1. Refresh the page
2. Log out and log back in
3. Check internet connection stability
4. Contact IT if problem persists

#### **🎫 Ticket Issues**

**Issue**: Cannot create new tickets
**Solutions**:
1. Verify all required fields are filled
2. Check file attachment size limits
3. Ensure stable internet connection
4. Try different browser

**Issue**: Not receiving email notifications
**Solutions**:
1. Check spam/junk email folders
2. Verify email address in profile
3. Check notification preferences
4. Contact administrator to verify email settings

#### **🤖 Chatbot Problems**

**Issue**: Chatbot not responding
**Solutions**:
1. Refresh the page
2. Clear browser cache
3. Check internet connection
4. Try typing "help" or "restart"

**Issue**: Bot provides incorrect information
**Solutions**:
1. Rephrase your question
2. Be more specific with details
3. Ask to speak with human agent
4. Report the issue to administrators

### Browser Compatibility

#### **✅ Supported Browsers**
- **Chrome**: Version 90+ (Recommended)
- **Firefox**: Version 88+
- **Safari**: Version 14+
- **Edge**: Version 90+

#### **⚙️ Browser Settings**
- **JavaScript**: Must be enabled
- **Cookies**: Required for login
- **Pop-ups**: Allow for file downloads
- **Local Storage**: Required for offline features

### Performance Optimization

#### **🚀 Speed Improvements**
- Use recommended browsers
- Keep browser updated
- Clear cache regularly
- Close unnecessary tabs
- Check internet connection speed

#### **💾 Storage Management**
- Clear browser cache monthly
- Remove old downloaded files
- Limit file attachment sizes
- Use compressed image formats

---

## ❓ Frequently Asked Questions

### General Questions

#### **Q: How do I change my password?**
A: Go to Profile Settings > Security > Change Password. Enter your current password and set a new one following the password policy requirements.

#### **Q: Can I attach files to tickets?**
A: Yes, you can attach files up to 10MB each. Supported formats include images, documents, and compressed archives. Use the attachment button when creating or updating tickets.

#### **Q: How do I track my ticket status?**
A: You can track tickets through:
- Email notifications for updates
- "My Tickets" section in the dashboard
- Ticket ID search function
- Mobile notifications (if enabled)

#### **Q: What's the difference between priority levels?**
A:
- **Critical**: System down, security breach (Response: 30 min)
- **High**: Major functionality impacted (Response: 2 hours)
- **Medium**: Minor functionality issues (Response: 8 hours)
- **Low**: General questions, requests (Response: 24 hours)

### Chatbot Questions

#### **Q: Can the chatbot create tickets for me?**
A: Yes! Describe your issue to the chatbot, and it will gather necessary information to create a ticket automatically. You'll receive a confirmation with the ticket ID.

#### **Q: Is the chatbot available 24/7?**
A: The chatbot operates based on configured business hours. Outside these hours, it can still create tickets, but human agent assistance may be limited.

#### **Q: What if the chatbot can't help me?**
A: The chatbot will recognize when it can't provide adequate assistance and will offer to:
- Create a ticket for human review
- Transfer you to a live agent (during business hours)
- Provide alternative resources or documentation

### Technical Questions

#### **Q: Why am I not receiving email notifications?**
A: Check:
1. Spam/junk folders
2. Email address accuracy in your profile
3. Notification preferences settings
4. Contact your administrator if issues persist

#### **Q: Can I use the system on my mobile device?**
A: Yes! The system is fully responsive and works on mobile devices. You can access all features through your mobile browser.

#### **Q: How long are tickets kept in the system?**
A: Tickets are retained according to your organization's data retention policy. Typically:
- Active tickets: Indefinitely
- Closed tickets: 2-7 years
- Contact your administrator for specific policies

### Account & Access Questions

#### **Q: How do I request additional permissions?**
A: Contact your system administrator or use the helpdesk to request role changes or additional permissions. Include details about why you need the access.

#### **Q: Can I view other people's tickets?**
A: Access depends on your role:
- **Users**: Only your own tickets
- **Agents**: Assigned tickets and department tickets
- **Administrators**: All tickets system-wide

#### **Q: What happens if I forget my username?**
A: Contact your system administrator or use the "Forgot Username" link on the login page. You'll need to provide your registered email address.

---

## 📞 Getting Additional Help

### Contact Information

#### **🆘 Emergency Support**
- **Phone**: [Your emergency number]
- **Email**: emergency@your-organization.com
- **Available**: 24/7 for critical issues

#### **💬 General Support**
- **Help Desk**: Create a ticket in the system
- **Email**: support@your-organization.com
- **Phone**: [Your support number]
- **Hours**: Monday-Friday, 8 AM - 6 PM

#### **📚 Self-Service Resources**
- **Knowledge Base**: Built-in documentation
- **Video Tutorials**: [Link to video library]
- **User Community**: [Link to forums]
- **Training Materials**: [Link to training resources]

### Feedback & Suggestions

We value your feedback! Please share:

- **System Improvements**: Suggest new features
- **Bug Reports**: Report issues or problems
- **User Experience**: Share usability feedback
- **Training Needs**: Request additional help or documentation

**Submit Feedback**: Use the feedback form in the system or create a ticket with category "System Feedback"

---

<div align="center">

**📖 End of User Manual**

*Last Updated: December 2024*  
*Version: 1.0*

For the most current version of this manual, please check the system's help section.

</div> 