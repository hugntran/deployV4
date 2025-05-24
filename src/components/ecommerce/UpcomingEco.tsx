import React, { useEffect, useState } from "react";
import { fetchWithAuth } from "../../api/fetchWithAuth";
import { API_BASE_URL } from "../../config";

type TicketData = {
  ticket: {
    id: string;
    startDateTime: string;
    endDateTime: string;
    isCheckIn: boolean | null;
  };
  locationName: string;
  slotNumber: string;
  zoneGate: string;
};

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`; // yyyy-mm-dd
};

const UpcomingEco: React.FC = () => {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const locationId = localStorage.getItem("locationId");
        if (!locationId) return;

        const now = new Date();
        const todayStr = formatDate(now);
        const endOfToday = new Date(todayStr + "T23:59:59");

        const res = await fetchWithAuth<{ content: TicketData[] }>(
          `${API_BASE_URL}/app-data-service/tickets/pageable/find?page=0&size=100&sort=createdAt,DESC&status=PAID&fromDate=${todayStr}&toDate=${todayStr}&locationId=${locationId}`
        );
        const upcomingTickets = res.content.filter((t) => {
          const start = new Date(t.ticket.endDateTime);
          return start > now && start <= endOfToday && t.ticket.isCheckIn === null;
        });

        setTickets(upcomingTickets.slice(0, 5));
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  if (loading) return <p>Loading recent tickets...</p>;

  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <h2 className="text-lg font-semibold mb-4">🎟️ Upcoming Tickets</h2>
      <table className="w-full text-sm text-left border">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-4 py-2">Ticket ID</th>
            <th className="px-4 py-2">Location</th>
            <th className="px-4 py-2">Slot</th>
            <th className="px-4 py-2">Start Time</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr key={t.ticket.id} className="border-t">
              <td className="px-4 py-2">{t.ticket.id.slice(0, 8).toUpperCase()}</td>
              <td className="px-4 py-2">{t.locationName}</td>
              <td className="px-4 py-2">
                {t.slotNumber} - {t.zoneGate}
              </td>
              <td className="px-4 py-2">{new Date(t.ticket.startDateTime).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UpcomingEco;
