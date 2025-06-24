from typing import Any, Dict, List, Text
import requests
import logging
from datetime import datetime

from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet

logger = logging.getLogger(__name__)

class ActionCreateSupportTicket(Action):
    def name(self) -> Text:
        return "action_create_support_ticket"

    def _generate_subject_from_description(self, description: str) -> str:
        """Generate a concise subject line based on issue description."""
        if not description:
            return "General Support Request"
            
        description_lower = description.lower()
        
        # Check for specific issue types based on keywords in description
        if any(word in description_lower for word in ["login", "password", "sign in", "access", "authenticate"]):
            return "Login/Access Issue"
        elif any(word in description_lower for word in ["email", "mail", "notification", "message"]):
            return "Email/Notification Issue"
        elif any(word in description_lower for word in ["registration", "register", "account", "create account"]):
            return "Account Registration Issue"
        elif any(word in description_lower for word in ["payment", "bill", "fee", "charge", "invoice"]):
            return "Payment/Billing Issue"
        elif any(word in description_lower for word in ["course", "class", "enrollment", "enroll"]):
            return "Course/Enrollment Issue"
        elif any(word in description_lower for word in ["technical", "error", "bug", "not working", "broken"]):
            return "Technical Issue"
        elif any(word in description_lower for word in ["grades", "grade", "transcript", "academic"]):
            return "Academic Records Issue"
        elif any(word in description_lower for word in ["schedule", "timetable", "time", "calendar"]):
            return "Schedule/Timetable Issue"
        else:
            # Extract the first meaningful phrase as subject (up to 50 characters)
            words = description.split()
            if len(words) > 0:
                subject = " ".join(words[:8])  # Take first 8 words
                if len(subject) > 50:
                    subject = subject[:47] + "..."
                return subject
            return "General Support Request"

    def _determine_priority_from_description(self, description: str) -> str:
        """Determine priority based on urgency indicators in the description."""
        if not description:
            return "Medium"
            
        description_lower = description.lower()
        
        # High priority indicators
        if any(word in description_lower for word in ["urgent", "emergency", "critical", "asap", "immediately", "deadline", "can't access", "locked out"]):
            return "High"
        # Low priority for general inquiries
        elif any(word in description_lower for word in ["question", "wondering", "curious", "info", "information", "how to"]):
            return "Low"
        else:
            return "Medium"  # Default to medium

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        
        # Get slot values
        user_email = tracker.get_slot("user_email")
        registration_number = tracker.get_slot("registration_number")
        issue_description = tracker.get_slot("issue_description")
        
        # Generate subject and priority from description
        issue_subject = self._generate_subject_from_description(issue_description)
        issue_priority = self._determine_priority_from_description(issue_description)
        
        # Use email as user name (extract name part before @)
        user_name = user_email.split('@')[0] if user_email else "Unknown User"
        
        # Prepare the request payload
        payload = {
            "subject": issue_subject,
            "description": issue_description,
            "category": "General Support",
            "requester": {
                "email": user_email,
                "registrationNumber": registration_number,
                "name": user_name
            },
            "priority": issue_priority,
            "source": "chat",
            "tags": ["chatbot", "escalation", "auto-generated-subject"],
            "customFields": {
                "sessionId": tracker.sender_id,
                "escalatedAt": datetime.now().isoformat(),
                "generatedSubject": True
            }
        }
        
        try:
            # Make API call to create ticket
            response = requests.post(
                "http://localhost:5500/api/v1/tickets/public",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200 or response.status_code == 201:
                response_data = response.json()
                ticket_data = response_data.get("data", {}).get("ticket", {})
                ticket_id = ticket_data.get("ticketId", "Unknown")
                
                logger.info(f"Successfully created ticket {ticket_id} for user {user_email}")
                
                return [
                    SlotSet("ticket_created_successfully", True),
                    SlotSet("created_ticket_id", ticket_id),
                    SlotSet("ticket_status", ticket_data.get("status", "Open")),
                    SlotSet("issue_subject", issue_subject),
                    SlotSet("issue_priority", issue_priority),
                    SlotSet("user_name", user_name)
                ]
            else:
                logger.error(f"Failed to create ticket. Status: {response.status_code}, Response: {response.text}")
                return [SlotSet("ticket_created_successfully", False)]
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Error creating support ticket: {str(e)}")
            return [SlotSet("ticket_created_successfully", False)]
        except Exception as e:
            logger.error(f"Unexpected error creating support ticket: {str(e)}")
            return [SlotSet("ticket_created_successfully", False)] 