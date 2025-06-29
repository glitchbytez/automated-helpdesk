from typing import Any, Dict, List, Text
import requests
import logging
import os
from datetime import datetime

from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet

logger = logging.getLogger(__name__)

class ActionCreatePersonalDetailsTicket(Action):
    def name(self) -> Text:
        return "action_create_personal_details_ticket"

    def _generate_subject(self, details_type: str) -> str:
        """Generate subject based on detail type to amend."""
        type_mapping = {
            "gender": "Gender Amendment Request",
            "date_of_birth": "Date of Birth Amendment Request",
            "id_number": "ID Number Amendment Request",
            "name": "Name Amendment Request",
            "address": "Address Amendment Request",
            "contact_details": "Contact Details Amendment Request",
            "multiple_details": "Multiple Personal Details Amendment Request"
        }
        
        return type_mapping.get(details_type, "Personal Details Amendment Request")

    def _generate_description(self, tracker: Tracker) -> str:
        """Generate detailed description for the ticket."""
        details_type = tracker.get_slot("details_to_amend")
        current_details = tracker.get_slot("current_details")
        correct_details = tracker.get_slot("correct_details")
        supporting_docs = tracker.get_slot("supporting_documents")
        
        description = f"Student requests amendment of personal details:\n\n"
        description += f"Detail Type to Amend: {details_type.replace('_', ' ').title()}\n"
        description += f"Current (Incorrect) Details: {current_details}\n"
        description += f"Correct Details: {correct_details}\n"
        description += f"Supporting Documents: {supporting_docs}\n\n"
        
        # Add required documents based on type
        description += "Required Documentation:\n"
        if details_type == "date_of_birth":
            description += "- Birth Certificate (certified copy)\n"
            description += "- National ID document\n"
        elif details_type == "id_number":
            description += "- New National ID document\n"
            description += "- Affidavit explaining ID change (if applicable)\n"
        elif details_type == "gender":
            description += "- Updated National ID document\n"
            description += "- Medical certificate (if applicable)\n"
        elif details_type == "name":
            description += "- Birth Certificate (certified copy)\n"
            description += "- Marriage Certificate (if name change due to marriage)\n"
            description += "- Deed Poll (if legal name change)\n"
            description += "- Updated National ID document\n"
        else:
            description += "- Supporting documentation as indicated above\n"
        
        description += "\nIMPORTANT: All documents must be certified copies or originals for verification."
            
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
        details_type = tracker.get_slot("details_to_amend")
        current_details = tracker.get_slot("current_details")
        correct_details = tracker.get_slot("correct_details")
        
        # Generate structured ticket data
        subject = self._generate_subject(details_type)
        description = self._generate_description(tracker)
        
        # Personal details amendments are usually medium priority
        priority = "Medium"
        
        # Prepare the request payload
        payload = {
            "subject": subject,
            "description": description,
            "category": "Student Records",
            "requester": {
                "email": user_email,
                "registrationNumber": registration_number,
                "name": user_email.split('@')[0] if user_email else "Unknown User"
            },
            "priority": priority,
            "source": "chat",
            "tags": ["personal-details", "amendment", details_type],
            "customFields": {
                "sessionId": tracker.sender_id,
                "amendmentType": details_type,
                "currentDetails": current_details,
                "correctDetails": correct_details,
                "supportingDocuments": tracker.get_slot("supporting_documents"),
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
                
                logger.info(f"Successfully created personal details ticket {ticket_id} for user {user_email}")
                
                # Send success message
                success_msg = f"Your personal details amendment request has been submitted successfully!\n\n"
                success_msg += f"**Ticket ID:** {ticket_id}\n"
                success_msg += f"**Amendment Type:** {details_type.replace('_', ' ').title()}\n"
                success_msg += f"**Priority:** {priority}\n\n"
                success_msg += "Our student records office will review your request and supporting documents. "
                success_msg += "You will be contacted via email if any additional documentation is required.\n\n"
                success_msg += "⚠️ **Important:** Please ensure you submit all required certified documents for processing."
                
                dispatcher.utter_message(text=success_msg)
                
                return [
                    SlotSet("ticket_created_successfully", True),
                    SlotSet("created_ticket_id", ticket_id)
                ]
            else:
                logger.error(f"Failed to create personal details ticket. Status: {response.status_code}")
                dispatcher.utter_message(text="I'm sorry, but I encountered an issue while creating your amendment request. Please try again later or contact our student records office directly.")
                return [SlotSet("ticket_created_successfully", False)]
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Error creating personal details ticket: {str(e)}")
            dispatcher.utter_message(text="I'm having trouble connecting to our ticketing system. Please try again later or contact our student records office directly.")
            return [SlotSet("ticket_created_successfully", False)]
        except Exception as e:
            logger.error(f"Unexpected error creating personal details ticket: {str(e)}")
            return [SlotSet("ticket_created_successfully", False)] 