from typing import Any, Dict, List, Text
import requests
import logging
import os
from datetime import datetime

from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet

logger = logging.getLogger(__name__)

class ActionCreatePortalIssuesTicket(Action):
    def name(self) -> Text:
        return "action_create_portal_issues_ticket"

    def _generate_subject(self, error_type: str, error_message: str) -> str:
        """Generate subject based on portal error type."""
        type_mapping = {
            "registration_date_error": "Portal Registration Date Error",
            "billing_mode_error": "Portal Billing Mode Error",
            "repeat_courses_error": "Portal Repeat Courses Error",
            "dates_missing_error": "Portal Missing Dates Error",
            "results_viewing_error": "Portal Results Viewing Error",
            "other_portal_error": "Portal System Error"
        }
        
        base_subject = type_mapping.get(error_type, "Portal Issue")
        if len(error_message) > 50:
            return f"{base_subject} - {error_message[:47]}..."
        return f"{base_subject} - {error_message}"

    def _generate_description(self, tracker: Tracker) -> str:
        """Generate detailed description for the ticket."""
        error_type = tracker.get_slot("portal_error_type")
        error_message = tracker.get_slot("portal_error_message")
        intended_action = tracker.get_slot("intended_action")
        affected_courses = tracker.get_slot("affected_courses")
        current_level = tracker.get_slot("current_level_semester")
        
        description = f"Student is experiencing a portal issue:\n\n"
        description += f"Error Type: {error_type.replace('_', ' ').title()}\n"
        description += f"Error Message: {error_message}\n"
        description += f"Attempted Action: {intended_action}\n"
        description += f"Current Level/Semester: {current_level}\n"
        
        if affected_courses:
            description += f"Affected Course Codes: {affected_courses}\n"
        
        # Add troubleshooting context
        description += "\nTroubleshooting Required:\n"
        description += "- Verify student registration status\n"
        description += "- Check system configurations for student's level/semester\n"
        
        if error_type == "billing_mode_error":
            description += "- Review billing mode settings for student\n"
        elif error_type == "registration_date_error":
            description += "- Verify registration dates for student's academic level\n"
        elif error_type == "repeat_courses_error":
            description += "- Check repeat course status in student record\n"
        elif error_type == "results_viewing_error":
            description += "- Verify results publication status for affected courses\n"
            
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
        error_type = tracker.get_slot("portal_error_type")
        error_message = tracker.get_slot("portal_error_message")
        
        # Generate structured ticket data
        subject = self._generate_subject(error_type, error_message)
        description = self._generate_description(tracker)
        
        # Portal issues are usually high priority as they block student access
        priority = "High"
        
        # Prepare the request payload
        payload = {
            "subject": subject,
            "description": description,
            "category": "Portal Technical Issues",
            "requester": {
                "email": user_email,
                "registrationNumber": registration_number,
                "name": user_email.split('@')[0] if user_email else "Unknown User"
            },
            "priority": priority,
            "source": "chat",
            "tags": ["portal-issue", error_type, "technical"],
            "customFields": {
                "sessionId": tracker.sender_id,
                "errorType": error_type,
                "errorMessage": error_message,
                "intendedAction": tracker.get_slot("intended_action"),
                "affectedCourses": tracker.get_slot("affected_courses"),
                "academicLevel": tracker.get_slot("current_level_semester"),
                "submittedAt": datetime.now().isoformat()
            }
        }
        
        try:
            # Make API call to create ticket
            response = requests.post(
                f"{os.getenv('HELPDESK_API_URL', 'http://localhost:5500')}/api/v1/tickets/public",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200 or response.status_code == 201:
                response_data = response.json()
                ticket_data = response_data.get("data", {}).get("ticket", {})
                ticket_id = ticket_data.get("ticketId", "Unknown")
                
                logger.info(f"Successfully created portal issues ticket {ticket_id} for user {user_email}")
                
                # Send success message
                success_msg = f"Your portal issue has been reported successfully!\n\n"
                success_msg += f"**Ticket ID:** {ticket_id}\n"
                success_msg += f"**Issue Type:** {error_type.replace('_', ' ').title()}\n"
                success_msg += f"**Priority:** {priority}\n\n"
                success_msg += "Our IT support team will investigate this portal issue and get back to you via email. "
                success_msg += "In the meantime, you may want to try accessing the portal from a different browser or device."
                
                dispatcher.utter_message(text=success_msg)
                
                return [
                    SlotSet("ticket_created_successfully", True),
                    SlotSet("created_ticket_id", ticket_id)
                ]
            else:
                logger.error(f"Failed to create portal issues ticket. Status: {response.status_code}")
                dispatcher.utter_message(text="I'm sorry, but I encountered an issue while reporting your portal problem. Please try again later or contact our IT support directly.")
                return [SlotSet("ticket_created_successfully", False)]
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Error creating portal issues ticket: {str(e)}")
            dispatcher.utter_message(text="I'm having trouble connecting to our ticketing system. Please try again later or contact our IT support directly.")
            return [SlotSet("ticket_created_successfully", False)]
        except Exception as e:
            logger.error(f"Unexpected error creating portal issues ticket: {str(e)}")
            return [SlotSet("ticket_created_successfully", False)] 