from typing import Any, Dict, List, Text
import requests
import logging
import os
from datetime import datetime

from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet

logger = logging.getLogger(__name__)

class ActionCreateCourseRegistrationTicket(Action):
    def name(self) -> Text:
        return "action_create_course_registration_ticket"

    def _generate_subject(self, request_type: str, course_codes: str) -> str:
        """Generate subject based on registration type and courses."""
        type_mapping = {
            "add_courses": "Add Courses Request",
            "delete_courses": "Delete Courses Request", 
            "carry_courses": "Carry Courses Registration",
            "supplementary_courses": "Supplementary Examination Registration"
        }
        
        base_subject = type_mapping.get(request_type, "Course Registration Request")
        if course_codes:
            return f"{base_subject} - {course_codes}"
        return base_subject

    def _generate_description(self, tracker: Tracker) -> str:
        """Generate detailed description for the ticket."""
        request_type = tracker.get_slot("registration_request_type")
        current_level = tracker.get_slot("current_level_semester")
        course_codes = tracker.get_slot("course_codes")
        additional_req = tracker.get_slot("additional_requirements")
        
        type_descriptions = {
            "add_courses": "Student requests to add the following courses to their registration",
            "delete_courses": "Student requests to delete the following courses from their registration",
            "carry_courses": "Student requests to register for carry courses",
            "supplementary_courses": "Student requests to register for supplementary examination courses"
        }
        
        description = f"{type_descriptions.get(request_type, 'Course registration request')}\n\n"
        description += f"Current Level/Semester: {current_level}\n"
        description += f"Course Codes: {course_codes}\n"
        
        if additional_req:
            description += f"Additional Requirements: {additional_req}\n"
        
        # Add important notes based on type
        if request_type in ["carry_courses", "supplementary_courses"]:
            description += "\nIMPORTANT: Student must provide proof of fee payment for this request to be processed."
            
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
        request_type = tracker.get_slot("registration_request_type")
        course_codes = tracker.get_slot("course_codes")
        
        # Generate structured ticket data
        subject = self._generate_subject(request_type, course_codes)
        description = self._generate_description(tracker)
        
        # Determine priority - carry and supplementary courses are usually urgent
        priority = "High" if request_type in ["carry_courses", "supplementary_courses"] else "Medium"
        
        # Prepare the request payload
        payload = {
            "subject": subject,
            "description": description,
            "category": "Academic Registration",
            "requester": {
                "email": user_email,
                "registrationNumber": registration_number,
                "name": user_email.split('@')[0] if user_email else "Unknown User"
            },
            "priority": priority,
            "source": "chat",
            "tags": ["course-registration", request_type, "academic"],
            "customFields": {
                "sessionId": tracker.sender_id,
                "requestType": request_type,
                "courseCodes": course_codes,
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
                
                logger.info(f"Successfully created course registration ticket {ticket_id} for user {user_email}")
                
                # Send success message
                success_msg = f"Your course registration request has been submitted successfully!\n\n"
                success_msg += f"**Ticket ID:** {ticket_id}\n"
                success_msg += f"**Request Type:** {request_type.replace('_', ' ').title()}\n"
                success_msg += f"**Course Codes:** {course_codes}\n"
                success_msg += f"**Priority:** {priority}\n\n"
                success_msg += "Our academic office will review your request and get back to you via email."
                
                if request_type in ["carry_courses", "supplementary_courses"]:
                    success_msg += "\n\n⚠️ **Important:** Please ensure you have paid the relevant fees for this request to be processed."
                
                dispatcher.utter_message(text=success_msg)
                
                return [
                    SlotSet("ticket_created_successfully", True),
                    SlotSet("created_ticket_id", ticket_id)
                ]
            else:
                logger.error(f"Failed to create course registration ticket. Status: {response.status_code}")
                dispatcher.utter_message(text="I'm sorry, but I encountered an issue while creating your course registration request. Please try again later or contact our academic office directly.")
                return [SlotSet("ticket_created_successfully", False)]
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Error creating course registration ticket: {str(e)}")
            dispatcher.utter_message(text="I'm having trouble connecting to our ticketing system. Please try again later or contact our academic office directly.")
            return [SlotSet("ticket_created_successfully", False)]
        except Exception as e:
            logger.error(f"Unexpected error creating course registration ticket: {str(e)}")
            return [SlotSet("ticket_created_successfully", False)] 