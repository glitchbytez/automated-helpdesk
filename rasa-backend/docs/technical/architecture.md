# Rasa Backend Technical Architecture

## Overview

The Rasa backend provides conversational AI capabilities for the student support chatbot. It uses machine learning to understand user intents, extract entities, and manage dialogue flows through story-based training.

## Technology Stack

- **Rasa Open Source 3.6**: Conversational AI framework
- **Python 3.8+**: Runtime environment
- **TensorFlow**: Machine learning backend
- **spaCy**: Natural language processing
- **Redis**: Session storage (optional)
- **Docker**: Containerized deployment

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input    │    │   NLU Pipeline  │    │ Dialogue Core   │
│   Processing    │◄──►│   (Intent &     │◄──►│   (Policy &     │
│                 │    │   Entity)       │    │   Stories)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Custom Actions  │    │ Response        │    │ External APIs   │
│ & Integrations  │    │ Generation      │    │ (Helpdesk)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Components

### 1. NLU Pipeline

The Natural Language Understanding pipeline processes user messages:

```yaml
# NLU Components
pipeline:
  - name: WhitespaceTokenizer        # Split text into tokens
  - name: RegexFeaturizer           # Pattern-based features
  - name: LexicalSyntacticFeaturizer # POS tags, lemmas
  - name: CountVectorsFeaturizer    # Bag-of-words features
  - name: DIETClassifier            # Intent + Entity classification
  - name: EntitySynonymMapper       # Entity normalization
  - name: FallbackClassifier        # Low-confidence handling
```

#### Intent Classification

The system recognizes these primary intents:

```python
SUPPORTED_INTENTS = [
    'course_registration_request',
    'level_progression_inquiry', 
    'personal_details_update',
    'portal_issues_report',
    'general_support_request',
    'human_handoff_request'
]
```

#### Entity Extraction

Entities provide structured data from user messages:

```yaml
entities:
  - course_code      # CS 101, MATH 201
  - semester         # Fall 2024, Spring 2025
  - student_id       # 12345678
  - issue_type       # login, access, loading
  - detail_type      # address, phone, email
```

### 2. Dialogue Management

#### Policy Configuration

```yaml
policies:
  - name: MemoizationPolicy       # Exact story matching
    max_history: 5
  
  - name: RulePolicy              # Rule-based responses
  
  - name: UnexpecTEDIntentPolicy  # Unexpected intent handling
    max_history: 5
    epochs: 100
  
  - name: TEDPolicy               # Transformer-based dialogue
    max_history: 5
    epochs: 100
    constrain_similarities: true
```

#### Story Structure

Stories define conversation flows:

```yaml
stories:
- story: course registration happy path
  steps:
  - intent: course_registration_request
    entities:
    - course_code: "CS 101"
  - action: utter_ask_student_id
  - intent: provide_student_id
    entities:
    - student_id: "12345678"
  - action: action_create_course_registration_ticket
  - action: utter_ticket_created
```

### 3. Custom Actions

#### Action Server Architecture

```python
# actions/__init__.py
from rasa_sdk import Action
from rasa_sdk.executor import CollectingDispatcher

class BaseTicketAction(Action):
    """Base class for ticket creation actions"""
    
    def __init__(self):
        self.helpdesk_url = "http://helpdesk-backend:5500/api/v1/public/tickets"
        self.timeout = 10
    
    def create_ticket(self, ticket_data):
        """Common ticket creation logic"""
        import requests
        
        try:
            response = requests.post(
                self.helpdesk_url,
                json=ticket_data,
                timeout=self.timeout
            )
            return response
        except requests.RequestException as e:
            raise Exception(f"Ticket creation failed: {str(e)}")
```

#### Specialized Actions

```python
# actions/action_create_course_registration_ticket.py
class ActionCreateCourseRegistrationTicket(BaseTicketAction):
    
    def name(self) -> str:
        return "action_create_course_registration_ticket"
    
    def run(self, dispatcher, tracker, domain):
        # Extract slot values
        course_code = tracker.get_slot("course_code")
        student_id = tracker.get_slot("student_id")
        
        # Build ticket
        ticket_data = {
            "subject": f"Course Registration - {course_code}",
            "description": self.build_description(tracker),
            "category": "course_registration",
            "priority": "normal",
            "metadata": {
                "course_code": course_code,
                "student_id": student_id,
                "source": "chatbot"
            }
        }
        
        # Create ticket
        try:
            response = self.create_ticket(ticket_data)
            if response.status_code == 201:
                ticket = response.json()
                dispatcher.utter_message(
                    text=f"Created ticket #{ticket['ticketId']}. "
                         f"You'll receive assistance within 24 hours."
                )
            else:
                dispatcher.utter_message(
                    text="Unable to create ticket. Please try again."
                )
        except Exception:
            dispatcher.utter_message(
                text="Error processing request. Contact support directly."
            )
        
        return []
```

### 4. Integration Points

#### Helpdesk API Integration

```python
# utils/helpdesk_client.py
class HelpdeskClient:
    def __init__(self, base_url, api_key=None):
        self.base_url = base_url
        self.api_key = api_key
        self.session = requests.Session()
        
        if api_key:
            self.session.headers.update({
                'Authorization': f'Bearer {api_key}'
            })
    
    def create_ticket(self, ticket_data):
        """Create a support ticket"""
        endpoint = f"{self.base_url}/tickets"
        response = self.session.post(endpoint, json=ticket_data)
        response.raise_for_status()
        return response.json()
    
    def update_ticket(self, ticket_id, update_data):
        """Update existing ticket"""
        endpoint = f"{self.base_url}/tickets/{ticket_id}"
        response = self.session.patch(endpoint, json=update_data)
        response.raise_for_status()
        return response.json()
```

#### Chatbot Server Integration

```python
# Socket.IO integration for real-time communication
import socketio

class RasaSocketIOChannel:
    def __init__(self, server_url):
        self.sio = socketio.AsyncClient()
        self.server_url = server_url
        
    async def connect(self):
        await self.sio.connect(self.server_url)
        
    async def send_message(self, recipient_id, message):
        await self.sio.emit('bot_uttered', {
            'recipient_id': recipient_id,
            'text': message.get('text'),
            'buttons': message.get('buttons', []),
            'quick_replies': message.get('quick_replies', [])
        })
```

## Model Training Pipeline

### 1. Data Processing

```python
# training/data_processor.py
class TrainingDataProcessor:
    def __init__(self, data_dir="data/"):
        self.data_dir = data_dir
        
    def validate_data(self):
        """Validate training data integrity"""
        from rasa.cli.data import validate_data
        validate_data(domain="domain.yml", data=self.data_dir)
    
    def prepare_training_data(self):
        """Prepare and clean training data"""
        # Combine all NLU files
        # Validate story consistency
        # Check for data imbalances
        pass
    
    def augment_data(self):
        """Generate additional training examples"""
        # Paraphrasing for intent examples
        # Entity variation generation
        pass
```

### 2. Training Configuration

```yaml
# config.yml - Production configuration
recipe: default.v1
language: en

pipeline:
  - name: WhitespaceTokenizer
  - name: RegexFeaturizer
  - name: LexicalSyntacticFeaturizer
  - name: CountVectorsFeaturizer
    analyzer: char_wb
    min_ngram: 1
    max_ngram: 4
  - name: DIETClassifier
    epochs: 100
    constrain_similarities: true
    entity_recognition: true
    intent_classification: true
    use_masked_language_model: true
  - name: EntitySynonymMapper
  - name: ResponseSelector
    epochs: 100
    retrieval_intent: faq
  - name: FallbackClassifier
    threshold: 0.3
    ambiguity_threshold: 0.1

policies:
  - name: MemoizationPolicy
    max_history: 5
  - name: RulePolicy
    core_fallback_threshold: 0.3
    core_fallback_action_name: "action_default_fallback"
  - name: UnexpecTEDIntentPolicy
    max_history: 5
    epochs: 100
  - name: TEDPolicy
    max_history: 5
    epochs: 100
    constrain_similarities: true
```

### 3. Model Evaluation

```python
# evaluation/model_evaluator.py
class ModelEvaluator:
    def __init__(self, model_path):
        self.model_path = model_path
    
    def evaluate_nlu(self, test_data_path):
        """Evaluate NLU performance"""
        from rasa.core.test import test_nlu
        
        results = test_nlu(
            model=self.model_path,
            nlu_data=test_data_path,
            output_directory="results/nlu"
        )
        
        return {
            'intent_accuracy': results['intent_evaluation']['accuracy'],
            'entity_f1': results['entity_evaluation']['f1_score'],
            'confusion_matrix': results['intent_evaluation']['confusion_matrix']
        }
    
    def evaluate_core(self, test_stories_path):
        """Evaluate dialogue management"""
        from rasa.core.test import test_core
        
        results = test_core(
            model=self.model_path,
            stories=test_stories_path,
            output_directory="results/core"
        )
        
        return results
```

## Performance Optimization

### 1. Model Optimization

```yaml
# Optimized config for faster inference
pipeline:
  - name: WhitespaceTokenizer
  - name: CountVectorsFeaturizer
    max_features: 10000  # Limit feature space
  - name: DIETClassifier
    epochs: 50          # Reduced training time
    batch_size: 64      # Larger batch size
    eval_frequency: 25  # Less frequent evaluation
```

### 2. Caching Strategy

```python
# utils/cache.py
import redis
from functools import wraps

class RasaCache:
    def __init__(self, redis_url="redis://localhost:6379"):
        self.redis_client = redis.from_url(redis_url)
        self.ttl = 3600  # 1 hour
    
    def cache_response(self, key, response):
        """Cache bot response"""
        self.redis_client.setex(
            f"response:{key}",
            self.ttl,
            json.dumps(response)
        )
    
    def get_cached_response(self, key):
        """Retrieve cached response"""
        cached = self.redis_client.get(f"response:{key}")
        return json.loads(cached) if cached else None

def cache_predictions(func):
    """Decorator to cache NLU predictions"""
    @wraps(func)
    def wrapper(self, message):
        cache_key = hash(message)
        cached = self.cache.get_cached_response(cache_key)
        
        if cached:
            return cached
        
        result = func(self, message)
        self.cache.cache_response(cache_key, result)
        return result
    
    return wrapper
```

### 3. Monitoring and Metrics

```python
# monitoring/metrics.py
import time
from prometheus_client import Counter, Histogram, start_http_server

# Metrics collection
REQUEST_COUNT = Counter('rasa_requests_total', 'Total requests', ['intent'])
REQUEST_DURATION = Histogram('rasa_request_duration_seconds', 'Request duration')
CONFIDENCE_SCORE = Histogram('rasa_confidence_score', 'Intent confidence')

class MetricsCollector:
    def __init__(self, port=8000):
        start_http_server(port)
    
    def track_request(self, intent, confidence, duration):
        REQUEST_COUNT.labels(intent=intent).inc()
        CONFIDENCE_SCORE.observe(confidence)
        REQUEST_DURATION.observe(duration)
    
    def track_action_execution(self, action_name, success):
        ACTION_COUNT.labels(action=action_name, status='success' if success else 'failure').inc()
```

## Deployment Architecture

### 1. Container Configuration

```dockerfile
# Dockerfile
FROM rasa/rasa:3.6.0

# Copy training data and configuration
COPY . /app
WORKDIR /app

# Install custom dependencies
COPY requirements-actions.txt /app/
RUN pip install -r requirements-actions.txt

# Train model
RUN rasa train --domain domain.yml --data data/ --config config.yml

# Expose ports
EXPOSE 5005 5055

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5005/status || exit 1

# Default command
CMD ["run", "--model", "models", "--server", "0.0.0.0", "--port", "5005"]
```

### 2. Service Communication

```yaml
# docker-compose.yml section
rasa-backend:
  build: .
  ports:
    - "5005:5005"
    - "5055:5055"
  environment:
    - RASA_DUCKLING_HTTP_URL=http://duckling:8000
    - HELPDESK_API_URL=http://helpdesk-backend:5500/api/v1
  depends_on:
    - redis
    - helpdesk-backend
  volumes:
    - ./models:/app/models
    - ./logs:/app/logs
```

### 3. Health Monitoring

```python
# health/health_check.py
class HealthChecker:
    def __init__(self, rasa_url="http://localhost:5005"):
        self.rasa_url = rasa_url
    
    async def check_health(self):
        """Comprehensive health check"""
        checks = {
            'rasa_server': await self.check_rasa_server(),
            'action_server': await self.check_action_server(),
            'model_loaded': await self.check_model_status(),
            'dependencies': await self.check_dependencies()
        }
        
        return {
            'status': 'healthy' if all(checks.values()) else 'unhealthy',
            'checks': checks,
            'timestamp': time.time()
        }
```

---

*This architecture provides a robust, scalable foundation for conversational AI with proper monitoring, caching, and integration capabilities.*

*Last updated: [Current Date]*
*Version: 1.0* 