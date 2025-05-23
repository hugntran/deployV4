import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config";

interface Ticket {
  id: string;
  createdAt: string;
}

interface TicketResponse {
  ticket: Ticket;
  slotNumber: string;
  zoneGate: string;
  locationName: string;
}

export interface ApiResponse {
  content: TicketResponse[];
  pageable: {
    totalPages: number;
  };
}

const fetchTickets = async (page: number): Promise<ApiResponse> => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    throw new Error("Token not found");
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(`${API_BASE_URL}/app-data-service/tickets/pageable/find?page=${page}&size=5`, {
    method: "GET",
    headers: headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch tickets");
  }

  return await response.json();
};

const TicketTable: React.FC = () => {
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [page, _setPage] = useState(0);
  const [_totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const data = await fetchTickets(page);
        setTickets(data.content);
        setTotalPages(data.pageable.totalPages);
      } catch (error) {
        console.error("Error loading tickets:", error);
      }
    };
    loadTickets();
  }, [page]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Upcoming guest</h2>
      <table className="min-w-full table-auto border border-gray-200 shadow-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-4 py-2 text-left border">ID</th>
            <th className="px-4 py-2 text-left border">Location</th>
            <th className="px-4 py-2 text-left border">Zone/Slot</th>
            <th className="px-4 py-2 text-left border">Created At</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticketResponse) => (
            <tr key={ticketResponse.ticket.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-2 border font-mono">{ticketResponse.ticket.id.slice(0, 8).toUpperCase()}</td>
              <td className="px-4 py-2 border">{ticketResponse.locationName}</td>
              <td className="px-4 py-2 border whitespace-nowrap">{`${ticketResponse.zoneGate} - ${ticketResponse.slotNumber}`}</td>
              <td className="px-4 py-2 border">{new Date(ticketResponse.ticket.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TicketTable;
