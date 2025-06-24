from typing import Any, Text, Dict, List
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import ConversationPaused, UserUttered, Restarted

class ActionHumanHandoff(Action):
    def name(self) -> Text:
        return "action_human_handoff"

    async def run(
            self,
            dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]
    ) -> List[Dict[Text, Any]]:
        try:
            dispatcher.utter_message(json_message={
                "handoff": True,
                "session_id": tracker.sender_id,
                "message": "Connecting you to a live agent..."
            })
            return [ConversationPaused()]
        except Exception as e:
            dispatcher.utter_message(text="Failed to connect to agent. Please try again later.")
            return []