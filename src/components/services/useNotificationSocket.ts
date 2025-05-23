import { useEffect } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_BASE_URL } from "../../config";

interface NotificationContentData {
  locationId?: string;
  slotNumber?: string | number;
  ticketId?: string;
}

interface NotificationData {
  id: string;
  title: string;
  content: string;
  contentData?: NotificationContentData;
  type: string;
  createdAt: string;
}

export const useNotificationSocket = (onMessage: (notification: NotificationData) => void) => {
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const socket = new SockJS(`${API_BASE_URL}/app-data-service/ws?token=${token}`);
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => console.log("📡 STOMP Debug:", str),
    });

    stompClient.onConnect = () => {
      console.log("✅ WebSocket connected");

      const subscribe = (destination: string, label: string) => {
        stompClient.subscribe(destination, (message: IMessage) => {
          const data = JSON.parse(message.body);
          console.log(`🔔 ${label}:`, data);

          let title = label;
          let content = "New notify.";
          let contentData: NotificationContentData | undefined = undefined;

          // Map label -> title text
          const labelTitles: Record<string, string> = {
            "Check-In": "Customer Checked In",
            "Check-Out": "Customer Checked Out",
            "Verify-Conflict": "Extend Request",
            "Verify-Time-Change": "Time Change Request",
            Overdue: "Overdue Ticket",
          };

          // Helper data label
          const extractInfo = () => {
            switch (label) {
              case "Check-In":
              case "Check-Out":
                if (data.slot && data.ticket) {
                  return {
                    locationId: data.slot.locationId,
                    slotNumber: data.slot.slotNumber,
                    ticketId: data.ticket.id,
                  };
                }
                break;
              case "Verify-Conflict":
                if (data.parent?.ticket && data.parent.slotNumber) {
                  const t = data.parent.ticket;
                  return {
                    locationId: t.locationId,
                    slotNumber: data.parent.slotNumber,
                    ticketId: t.id,
                  };
                }
                break;
              case "Verify-Time-Change":
              case "Overdue":
                if (data.ticket && data.slotNumber) {
                  const t = data.ticket;
                  return {
                    locationId: t.locationId,
                    slotNumber: data.slotNumber,
                    ticketId: t.id,
                  };
                }
                break;
            }
            return undefined;
          };

          const info = extractInfo();

          if (info) {
            title = labelTitles[label] || label;
            content = `Location ID: ${info.locationId}, Slot: ${info.slotNumber}, Ticket ID: ${info.ticketId}`;
            contentData = info;
          }

          onMessage({
            id: data.id || `${Date.now()}`,
            title,
            content,
            contentData,
            type: label,
            createdAt: data.createdAt || new Date().toISOString(),
          });
        });
      };

      // topic
      subscribe("/topic/check-in", "Check-In");
      subscribe("/topic/check-out", "Check-Out");
      subscribe("/topic/verify", "Verify-Conflict");
      subscribe("/topic/overdue", "Overdue");
      subscribe("/topic/verify-time-change", "Verify-Time-Change");
    };

    stompClient.onStompError = (frame) => {
      console.error("🔥 STOMP Error:", frame.headers["message"], frame.body);
    };

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [onMessage]);
};
