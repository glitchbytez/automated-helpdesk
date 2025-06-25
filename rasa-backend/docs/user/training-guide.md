# Rasa Backend - Training and Management Guide

## Overview

This guide covers how to train, test, and manage the educational helpdesk chatbot built with Rasa Pro. The system uses flow-based conversations with LLM integration for handling student support requests.

## Prerequisites

- Rasa Pro installed and configured
- OpenAI API key set in environment (`OPENAI_API_KEY`)
- Milvus vector database running on localhost:19530
- Helpdesk backend API running on localhost:5500

## Training the Model

### Current Model Status

**Trained Model**: `20250624-121813-right-string.tar.gz` (105KB)
**Last Training**: June 24, 2025

### Training Process

```bash
# Navigate to rasa-backend directory
cd rasa-backend

# Train the model
rasa train

# Train with validation
rasa train --validation
```

### Training Data Structure

The training data is organized by functionality:

**Flow Files** (`data/functionality/`):
- `create_support_ticket.yml` - General support ticket creation
- `track_ticket.yml` - Ticket status tracking  
- `course_registration.yml` - Course enrollment issues
- `level_progression.yml` - Academic progression problems
- `portal_issues.yml` - Learning portal technical issues
- `personal_details_amendment.yml` - Student information updates

**Domain Files** (`domain/functionality/`):
- Mirror structure with slots, responses, and actions defined

## Supported Conversation Flows

### 1. General Support Ticket Creation

**Trigger**: Users requesting help with any issue
**Data Collection**:
- Email address (validated format: user@domain.com)
- Registration number (format: R123456Y)
- Issue description (free text)

**Auto-Processing**:
- Subject line generation from description keywords
- Priority assignment based on urgency indicators
- Category classification (Login, Email, Payment, etc.)

### 2. Ticket Tracking

**Trigger**: Users asking about ticket status
**Required**: Ticket ID
**Response**: Current status, priority, subject, last update

### 3. Specialized Ticket Types

**Course Registration**: 
- Handles enrollment problems
- Collects course-specific information

**Level Progression**:
- Academic advancement issues
- Grade/credit transfer problems

**Portal Issues**:
- Technical problems with learning platform
- Access and functionality problems

**Personal Details**:
- Student information updates
- Contact detail changes

### 4. Human Handoff

**Trigger**: Complex issues or user request
**Action**: Transfers to live agent with context

## Configuration Management

### Core Configuration (`config.yml`)

**Pipeline Components**:
1. **CompactLLMCommandGenerator**: Intent classification with GPT-4o
2. **FlowPolicy**: Conversation state management
3. **IntentlessPolicy**: Fallback handling with embeddings
4. **EnterpriseSearchPolicy**: Vector search in knowledge base

**Key Settings**:
- Language: English
- Assistant ID: `20250411-cb-calm`
- Vector search threshold: 1.0
- Max results: 3 per query

### Channel Configuration (`credentials.yml`)

**Available Channels**:
- REST API (no authentication)
- Socket.IO (real-time WebSocket)
- Rasa Enterprise integration

**Socket.IO Settings**:
- User message event: `user_uttered`
- Bot response event: `bot_uttered`
- Session persistence: Enabled
- CORS: All origins allowed

### API Integration (`endpoints.yml`)

**Helpdesk Backend**:
- Base URL: `http://localhost:5500/api/v1`
- Timeout: 10 seconds
- No authentication required

**Vector Database**:
- Milvus connection: localhost:19530
- Collection: `test`
- Credentials: rasa/rasa@123
- Embedding dimension: 1536

## Testing and Validation

### Interactive Testing

```bash
# Start interactive training session
rasa shell

# Test with debugging
rasa shell --debug

# Test specific endpoints
rasa shell --endpoints endpoints.yml
```

### Conversation Testing

**Test Scenarios**:

1. **Support Ticket Creation**:
   ```
   User: I can't log into my account
   Bot: [Collects email, registration, description]
   Bot: [Creates ticket with auto-generated subject]
   ```

2. **Ticket Tracking**:
   ```
   User: Check ticket status
   Bot: [Requests ticket ID]
   User: TKT123456
   Bot: [Shows status, priority, updates]
   ```

3. **Human Handoff**:
   ```
   User: I need to speak to someone
   Bot: [Initiates handoff process]
   ```

### Validation Checks

**Email Validation**: `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`
**Registration Format**: `^[Rr][0-9]{6}[A-Za-z]$` (e.g., R123456Y)

## Running the System

### Start Rasa Server

```bash
# Basic start
rasa run

# With action server
rasa run actions &
rasa run --enable-api --cors "*"

# Specific endpoints
rasa run --endpoints endpoints.yml

# Debug mode
rasa run --debug
```

### Action Server

```bash
# Start action server separately
rasa run actions --port 5055

# Debug actions
rasa run actions --debug
```

## Monitoring and Maintenance

### Log Monitoring

**Action Logs**: Monitor ticket creation success/failure rates
**API Errors**: Track helpdesk backend connectivity
**LLM Usage**: Monitor OpenAI API consumption

### Model Performance

**Key Metrics**:
- Successful ticket creation rate
- Email/registration validation accuracy  
- Subject line generation relevance
- Priority assignment accuracy

### Regular Maintenance

**Weekly Tasks**:
- Review conversation logs
- Check failed ticket creations
- Monitor API error rates
- Update training data from user interactions

**Monthly Tasks**:
- Retrain model with new data
- Review subject generation categories
- Update priority classification keywords
- Test all conversation flows

## Troubleshooting

### Common Issues

**Ticket Creation Fails**:
- Check helpdesk backend API (localhost:5500)
- Verify network connectivity
- Check API timeout settings

**Vector Search Not Working**:
- Verify Milvus database connection
- Check collection 'test' exists
- Validate credentials (rasa/rasa@123)

**LLM Responses Missing**:
- Verify OPENAI_API_KEY environment variable
- Check internet connectivity
- Monitor API rate limits

**Slot Extraction Problems**:
- Review LLM prompt engineering
- Check validation regex patterns
- Test with various input formats

### Debugging Commands

```bash
# Check model loading
rasa run --debug

# Validate training data
rasa data validate

# Test specific stories
rasa test

# Inspect model files
rasa visualize
```

## Production Deployment

### Environment Variables

```bash
export OPENAI_API_KEY="your_openai_key"
export RASA_LOG_LEVEL="INFO"
export RASA_PORT="5005"
export ACTION_SERVER_PORT="5055"
```

### Process Management

**Recommended**: Use process managers like PM2 or systemd
**Health Checks**: Monitor both Rasa server and action server
**Load Balancing**: Consider multiple Rasa instances for high traffic

### Security Considerations

- **API Keys**: Use secure environment variable management
- **Database**: Change default Milvus credentials
- **Network**: Implement proper firewall rules
- **Monitoring**: Log all conversation data for audit

## Advanced Configuration

### Custom Prompts

Prompt templates are stored in `prompts/` directory:
- `enterprise-search-policy-template.jinja2`: Vector search prompts
- Custom personality prompts for response rephrasing

### Flow Customization

Modify flow files in `data/functionality/` to:
- Add new conversation paths
- Change data collection requirements
- Update validation rules
- Customize response templates

### Integration Extensions

**Additional Channels**: Add Slack, Microsoft Teams, etc.
**API Extensions**: Integrate with other campus systems
**Analytics**: Add conversation analytics and reporting
**Knowledge Base**: Expand vector database with institutional knowledge 