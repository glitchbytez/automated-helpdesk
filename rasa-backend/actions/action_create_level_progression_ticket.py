from typing import Any, Dict, List, Text
import requests
import logging
from datetime import datetime

from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet

logger = logging.getLogger(__name__)

class ActionCreateLevelProgressionTicket(Action):
    def name(self) -> Text:
        return "action_create_level_progression_ticket"

    def _generate_subject(self, progression_type: str, current_level: str, target_level: str) -> str:
        """Generate subject based on progression type."""
        type_mapping = {
            "roll_forward": "Roll Forward Request",
            "level_progression": "Level Progression Request",
            "semester_progression": "Semester Progression Request"
        }
        
        base_subject = type_mapping.get(progression_type, "Academic Progression Request")
        return f"{base_subject} - {current_level} to {target_level}"

    def _generate_description(self, tracker: Tracker) -> str:
        """Generate detailed description for the ticket."""
        progression_type = tracker.get_slot("progression_type")
        current_level = tracker.get_slot("current_level_semester")
        target_level = tracker.get_slot("target_level_semester")
        course_codes = tracker.get_slot("course_codes_for_registration")
        late_reg_proof = tracker.get_slot("late_registration_proof")
        
        type_descriptions = {
            "roll_forward": "Student requests to roll forward from current semester to next semester",
            "level_progression": "Student requests progression to next academic level",
            "semester_progression": "Student requests semester change/progression"
        }
        
        description = f"{type_descriptions.get(progression_type, 'Academic progression request')}\n\n"
        description += f"Current Level/Semester: {current_level}\n"
        description += f"Target Level/Semester: {target_level}\n"
        
        if course_codes:
            description += f"Courses to Register: {course_codes}\n"
        
        if late_reg_proof:
            description += f"Late Registration Fee Payment: {late_reg_proof}\n"
        
        # Add important notes
        if progression_type == "level_progression":
            description += "\nIMPORTANT: Please ensure all academic requirements for progression have been met."
        
        if late_reg_proof:
            description += "\nIMPORTANT: Student has indicated proof of late registration fee payment."
            
        return description

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        
        # Get slot values
        user_email = tracker.get_slot("user_email")
        registration_number = tracker.get_slot("registration_number")
        progression_type = tracker.get_slot("progression_type")
        current_level = tracker.get_slot("current_level_semester")
        target_level = tracker.get_slot("target_level_semester")
        
        # Generate structured ticket data
        subject = self._generate_subject(progression_type, current_level, target_level)
        description = self._generate_description(tracker)
        
        # Determine priority - level progression usually high priority
        priority = "High" if progression_type == "level_progression" else "Medium"
        
        # Prepare the request payload
        payload = {
            "subject": subject,
            "description": description,
            "category": "Academic Progression",
            "requester": {
                "email": user_email,
                "registrationNumber": registration_number,
                "name": user_email.split('@')[0] if user_email else "Unknown User"
            },
            "priority": priority,
            "source": "chat",
            "tags": ["academic-progression", progression_type, "academic"],
            "customFields": {
                "sessionId": tracker.sender_id,
                "progressionType": progression_type,
                "currentLevel": current_level,
                "targetLevel": target_level,
                "courseCodes": tracker.get_slot("course_codes_for_registration"),
                "submittedAt": datetime.now().isoformat()
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
                
                logger.info(f"Successfully created level progression ticket {ticket_id} for user {user_email}")
                
                # Send success message
                success_msg = f"Your academic progression request has been submitted successfully!\n\n"
                success_msg += f"**Ticket ID:** {ticket_id}\n"
                success_msg += f"**Request Type:** {progression_type.replace('_', ' ').title()}\n"
                success_msg += f"**From:** {current_level}\n"
                success_msg += f"**To:** {target_level}\n"
                success_msg += f"**Priority:** {priority}\n\n"
                success_msg += "Our academic office will review your request and get back to you via email."
                
                dispatcher.utter_message(text=success_msg)
                
                return [
                    SlotSet("ticket_created_successfully", True),
                    SlotSet("created_ticket_id", ticket_id)
                ]
            else:
                logger.error(f"Failed to create level progression ticket. Status: {response.status_code}")
                dispatcher.utter_message(text="I'm sorry, but I encountered an issue while creating your progression request. Please try again later or contact our academic office directly.")
                return [SlotSet("ticket_created_successfully", False)]
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Error creating level progression ticket: {str(e)}")
            dispatcher.utter_message(text="I'm having trouble connecting to our ticketing system. Please try again later or contact our academic office directly.")
            return [SlotSet("ticket_created_successfully", False)]
        except Exception as e:
            logger.error(f"Unexpected error creating level progression ticket: {str(e)}")
            return [SlotSet("ticket_created_successfully", False)] 