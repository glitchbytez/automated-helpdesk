'use client'
import Image from "next/image";
import { ChatWidgetProvider } from '@glitchbytez/rasa-chat-widget'

export default function Home() {
    const socketConfig = {
        rasaServerUrl: process.env.NEXT_PUBLIC_RASA_URL || "http://localhost:5005",
        socketPath: "/socket.io",
        botMessageEvent: "bot_uttered",
        userMessageEvent: "user_uttered",
        dashboardServerUrl: process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5501"
    };

    const feedbackEndpoint = `${process.env.NEXT_PUBLIC_HELPDESK_API_URL || "http://localhost:5500"}/api/v1/feedback/public`;

  return (
      <div>
        <h1>hello peeps</h1>
          <ChatWidgetProvider
              socketConfig={socketConfig}
              feedbackEndpoint={feedbackEndpoint}
              initialPosition="bottom-right"
          />
      </div>
  );
}
