# Rasa Backend - Technical Architecture

## Overview

This Rasa backend implements a conversational AI system specifically designed for educational helpdesk support. It uses Rasa Pro with advanced LLM integration, vector search capabilities, and custom actions for ticket management.

## Core Configuration

### Pipeline Architecture (`config.yml`)

**Language Model Integration:**
- **CompactLLMCommandGenerator**: Uses OpenAI GPT-4o for intent classification and command generation
- **FlowPolicy**: Manages conversation flow and dialogue state
- **IntentlessPolicy**: Handles fallback scenarios using LLM embedding similarity
- **EnterpriseSearchPolicy**: Vector-based knowledge retrieval from Milvus database

**Vector Store Configuration:**
- **Database**: Milvus vector database (localhost:19530)
- **Collection**: `test` collection with `rasa/rasa@123` credentials
- **Threshold**: 1.0 for search similarity
- **Embeddings**: OpenAI text-embedding-3-small model
- **Results**: Maximum 3 results per query

### Model Groups (`endpoints.yml`)

**OpenAI GPT-4o Configuration:**
- Model: `gpt-4o-mini` with 7-second timeout
- Temperature: 0.0 (deterministic responses)
- Top-p: 0.0 (focused sampling)

**Embedding Model:**
- Model: `text-embedding-3-small`
- Dimension: 1536 embeddings

## Custom Actions

### Ticket Management Actions

The system implements 7 custom actions for helpdesk integration:

#### 1. `ActionCreateSupportTicket`
**Purpose**: Creates general support tickets with intelligent categorization
**API Endpoint**: `POST http://localhost:5500/api/v1/tickets/public`
**Features**:
- Auto-generates subjects from issue descriptions
- Determines priority based on urgency keywords
- Validates email format: `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$`
- Validates registration numbers: `^[Rr][0-9]{6}[A-Za-z]$`

**Priority Logic**:
- **High**: urgent, emergency, critical, asap, immediately, deadline, can't access, locked out
- **Low**: question, wondering, curious, info, information, how to
- **Medium**: Default for all other cases

**Subject Generation Categories**:
- Login/Access Issue
- Email/Notification Issue  
- Account Registration Issue
- Payment/Billing Issue
- Course/Enrollment Issue
- Technical Issue
- Academic Records Issue
- Schedule/Timetable Issue

#### 2. `ActionTrackTicket`
**Purpose**: Retrieves ticket status information
**API Endpoint**: `GET http://localhost:5500/api/v1/tickets/{ticket_id}/status`
**Response Format**:
```
Ticket #{ticketId}:
• Status: {status}
• Priority: {priority}
• Subject: {subject}
• Last Updated: {updatedAt}
```

#### 3. Specialized Ticket Actions
- `ActionCreateCourseRegistrationTicket`: Course enrollment issues
- `ActionCreateLevelProgressionTicket`: Academic level advancement
- `ActionCreatePortalIssuesTicket`: Learning portal technical problems
- `ActionCreatePersonalDetailsTicket`: Student information updates

#### 4. `ActionHumanHandoff`
**Purpose**: Escalates conversations to live agents
**Implementation**: 
- Sends JSON message with `handoff: true` flag
- Pauses conversation using `ConversationPaused()` event
- Includes session ID for agent context

## Data Architecture

### Flow-Based Training Data Structure

**Directory Structure**:
```
data/functionality/
├── create_support_ticket.yml
├── track_ticket.yml
├── course_registration.yml
├── level_progression.yml
├── portal_issues.yml
└── personal_details_amendment.yml

domain/functionality/
├── create_support_ticket.yml (136 lines)
├── track_ticket.yml (23 lines)
├── course_registration.yml (70 lines)
├── level_progression.yml (80 lines)
├── portal_issues.yml (77 lines)
└── personal_details_amendment.yml (68 lines)
```

### Slot Management

**Core Slots**:
- `user_email`: Text validation with regex
- `registration_number`: Format R123456Y validation
- `issue_description`: Free text user input
- `ticket_created_successfully`: Boolean success flag
- `created_ticket_id`: Generated ticket identifier
- `ticket_status`: Current ticket state
- `user_satisfied_after_ticket`: Post-resolution satisfaction

**Slot Mapping**: All slots use `from_llm` mapping for LLM-based extraction

## Channel Configuration

### Available Channels (`credentials.yml`)

1. **REST API**: Basic HTTP endpoint (no auth required)
2. **Socket.IO**: Real-time WebSocket communication
   - User message event: `user_uttered`
   - Bot message event: `bot_uttered`
   - Session persistence: Enabled
   - CORS: Allow all origins (`*`)
3. **Rasa Enterprise**: Integration endpoint at `http://localhost:5002/api`

## Natural Language Generation

**Contextual Rephrasing**: Enabled with OpenAI GPT-4o model
- Automatically rephrases bot responses for natural conversation
- Uses default personality prompt (customizable via Jinja2 templates)

## Integration Points

### Helpdesk Backend API
**Base URL**: `http://localhost:5500/api/v1`
**Endpoints Used**:
- `POST /tickets/public`: Create new tickets
- `GET /tickets/{id}/status`: Retrieve ticket status

### Vector Database (Milvus)
**Connection**: localhost:19530
**Authentication**: rasa/rasa@123
**Collection**: test
**Purpose**: Knowledge base search and retrieval

## Error Handling

**Request Timeout**: 10 seconds for API calls
**Failure Modes**:
- Network errors: Graceful fallback messages
- Invalid responses: JSON parsing error handling
- Authentication failures: Connection retry logic

## Security Considerations

**API Key Management**: OpenAI API key via environment variable `OPENAI_API_KEY`
**Database Credentials**: Hardcoded in config (should be environmentalized for production)
**Endpoint Security**: No authentication on REST endpoints (relies on network security)

## Deployment Configuration

**Trained Model**: `20250624-121813-right-string.tar.gz` (105KB)
**Action Server**: Separate process for custom actions
**Ports**:
- Rasa server: 5005 (HTTP API)
- Action server: 5055 (webhooks)

## Development Architecture

**Language**: Python with Rasa SDK
**Dependencies**: requests, logging, datetime
**Action Module Structure**: Centralized imports via `__init__.py`
**Conversation Flow**: LLM-driven with fallback to rule-based patterns 