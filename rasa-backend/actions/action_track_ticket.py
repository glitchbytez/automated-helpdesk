from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
import requests
import os

class ActionTrackTicket(Action):
    def name(self) -> Text:
        return "action_track_ticket"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        
        # Get the ticket ID from the tracker
        ticket_id = tracker.get_slot("ticket_id")
        
        if not ticket_id:
            dispatcher.utter_message(text="I couldn't find a ticket ID to track. Could you please provide one?")
            return []

        try:
            # Get helpdesk API URL from environment variable
            helpdesk_api_url = os.getenv("HELPDESK_API_URL", "http://localhost:5500")
            url = f"{helpdesk_api_url}/api/v1/tickets/{ticket_id}/status"
            response = requests.get(url)
            response.raise_for_status()
            
            data = response.json()
            
            if data["status"] == "success":
                ticket_info = data["data"]["ticket"]
                
                # Create a formatted message with ticket details
                message = (
                    f"Here's the status of your ticket #{ticket_info['ticketId']}:\n"
                    f"• Status: {ticket_info['status']}\n"
                    f"• Priority: {ticket_info['priority']}\n"
                    f"• Subject: {ticket_info['subject']}\n"
                    f"• Last Updated: {ticket_info['updatedAt']}"
                )
                
                dispatcher.utter_message(text=message)
            else:
                dispatcher.utter_message(text="I'm sorry, I couldn't retrieve the ticket information. Please try again later.")
                
        except requests.RequestException as e:
            dispatcher.utter_message(text="I'm having trouble connecting to the ticket system. Please try again later.")
        except (KeyError, ValueError) as e:
            dispatcher.utter_message(text="I received an unexpected response from the ticket system. Please try again later.")
            
        return [] 