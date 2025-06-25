# Rasa Chatbot Training Guide

## Overview

This guide covers training and managing the Rasa-powered chatbot for student support. The system handles course registration, level progression, personal details updates, portal issues, and general support.

## Training Data Structure

### Intent Categories

#### 1. Course Registration
- **Intent**: `course_registration_request`
- **Entities**: `course_code`, `semester`, `year`
- **Examples**:
  - "I want to register for [CS 101](course_code)"
  - "How do I enroll in [Mathematics](course_code)?"
  - "Can you help me add [Biology](course_code) to my schedule?"

#### 2. Level Progression
- **Intent**: `level_progression_inquiry`
- **Entities**: `current_level`, `target_level`, `program`
- **Examples**:
  - "I need to progress to the next level"
  - "How do I advance from [Level 2](current_level) to [Level 3](target_level)?"

#### 3. Personal Details Amendment
- **Intent**: `personal_details_update`
- **Entities**: `detail_type`, `field_name`
- **Examples**:
  - "I need to update my contact information"
  - "How can I change my [address](detail_type)?"

#### 4. Portal Issues
- **Intent**: `portal_issues_report`
- **Entities**: `issue_type`, `browser`
- **Examples**:
  - "I can't log into the portal"
  - "The website is not loading"
  - "I'm having trouble accessing my grades"

## Training Process

### 1. Model Training

```bash
# Full training
rasa train

# Train only NLU
rasa train nlu

# Train with validation
rasa data validate && rasa train
```

### 2. Testing

```bash
# Test NLU model
rasa test nlu --cross-validation

# Test conversation flows
rasa test core --stories test_stories.yml
```

### 3. Interactive Training

```bash
# Fine-tune with interactive training
rasa interactive

# Review and correct predictions
rasa interactive --model models/latest.tar.gz
```

## Configuration

### Pipeline Setup

```yaml
# config.yml
recipe: default.v1
language: en
pipeline:
  - name: WhitespaceTokenizer
  - name: RegexFeaturizer
  - name: LexicalSyntacticFeaturizer
  - name: CountVectorsFeaturizer
  - name: DIETClassifier
    epochs: 100
  - name: EntitySynonymMapper
  - name: FallbackClassifier
    threshold: 0.3

policies:
  - name: MemoizationPolicy
  - name: RulePolicy
  - name: TEDPolicy
    max_history: 5
    epochs: 100
```

### Domain Configuration

```yaml
# domain/functionality/course_registration.yml
intents:
  - course_registration_request

entities:
  - course_code
  - semester

slots:
  course_code:
    type: text
    mappings:
    - type: from_entity
      entity: course_code

responses:
  utter_course_registration_help:
  - text: "I can help you with course registration. What course would you like to register for?"

actions:
  - action_create_course_registration_ticket
```

## Custom Actions

### Ticket Creation Action

```python
# actions/action_create_course_registration_ticket.py
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
import requests

class ActionCreateCourseRegistrationTicket(Action):
    def name(self) -> str:
        return "action_create_course_registration_ticket"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: dict):
        course_code = tracker.get_slot("course_code")
        student_id = tracker.get_slot("student_id")
        
        ticket_data = {
            "subject": f"Course Registration - {course_code}",
            "description": f"Course: {course_code}\nStudent ID: {student_id}",
            "category": "course_registration",
            "priority": "normal"
        }
        
        try:
            response = requests.post(
                "http://helpdesk-backend:5500/api/v1/public/tickets",
                json=ticket_data,
                timeout=10
            )
            
            if response.status_code == 201:
                ticket = response.json()
                dispatcher.utter_message(
                    text=f"Created support ticket #{ticket.get('ticketId')}. "
                         f"You'll receive assistance within 24 hours."
                )
            else:
                dispatcher.utter_message(
                    text="Sorry, I'm having trouble creating your ticket. Please try again."
                )
        except Exception:
            dispatcher.utter_message(
                text="Error processing your request. Please contact support directly."
            )
        
        return []
```

## Best Practices

### 1. Data Quality

- Use consistent entity naming
- Provide diverse training examples
- Balance intent distribution
- Include edge cases and variations

### 2. Intent Design

```yaml
# Good examples - specific and clear
- intent: course_registration_request
  examples: |
    - I want to register for [CS 101](course_code)
    - Can you help me enroll in [Biology](course_code)?
    - Registration for [MATH 201](course_code)

# Avoid - too generic or complex
- I need help
- I want to register for CS 101 and also update my address
```

### 3. Performance Monitoring

```bash
# Regular model evaluation
rasa test --model models/latest.tar.gz --out results/

# Check confidence scores
rasa shell --debug
```

## Deployment

### Running Services

```bash
# Start Rasa server
rasa run --model models/latest.tar.gz --port 5005

# Start action server
rasa run actions --port 5055

# Health check
curl http://localhost:5005/status
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM rasa/rasa:3.6.0

COPY . /app
WORKDIR /app

RUN rasa train

CMD ["run", "--model", "models", "--server", "0.0.0.0", "--port", "5005"]
```

## Troubleshooting

### Common Issues

1. **Low Confidence**: Add more training examples, adjust thresholds
2. **Entity Extraction**: Use regex patterns, synonyms
3. **Action Failures**: Check endpoints.yml, action server logs
4. **Performance**: Optimize pipeline, reduce model complexity

### Testing Commands

```bash
# Validate training data
rasa data validate

# Test specific intents
echo "I want to register for CS 101" | rasa shell nlu

# Debug conversations
rasa interactive --debug
```

---

*This guide provides essential information for training and maintaining the Rasa chatbot system.*

*Last updated: [Current Date]*
*Version: 1.0* 