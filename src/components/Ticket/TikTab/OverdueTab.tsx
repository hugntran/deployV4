import { useEffect, useState } from "react";
import { TableRow, TableCell, TableBody, TableContainer, Table, TableHead, Typography } from "@mui/material";
import { fetchWithAuth } from "../../../api/fetchWithAuth";
import { API_BASE_URL } from "../../../config";

interface OverdueTabProps {
  tickets: any[];
  locationId: string;
}

interface Slot {
  id: string;
  slotNumber: string;
  zone?: string;
  gate?: string;
  type: string;
}

export default function OverdueTab({ tickets, locationId }: OverdueTabProps) {
  const [slots, setSlots] = useState<Slot[]>([]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!locationId) return;
      try {
        const data = await fetchWithAuth(`${API_BASE_URL}/app-data-service/slots/find-pageable-slots?page=0&size=1000&locationId=${locationId}`);
        setSlots(data.content || []);
      } catch (error) {
        console.error("Error fetching slots:", error);
      }
    };

    fetchSlots();
  }, [locationId]);

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  const getSlotNumber = (slotId: string): string => {
    const slot = slots.find((s) => s.id === slotId);
    return slot?.slotNumber || "N/A";
  };

  const getZoneOrGate = (slotId: string): string => {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return "N/A";
    return slot.zone || slot.gate || "N/A";
  };

  return (
    <TableContainer>
      <Table size="medium" sx={{ tableLayout: "fixed", width: "100%" }}>
        <TableHead>
          <TableRow className="bg-gray-100">
            <TableCell>No</TableCell>
            <TableCell>Ticket Id</TableCell>
            <TableCell>Lot</TableCell>
            <TableCell>Start Time</TableCell>
            <TableCell>End Time</TableCell>
            <TableCell>Service</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography variant="body1">No tickets available.</Typography>
              </TableCell>
            </TableRow>
          ) : (
            tickets.map((ticket, index) => (
              <TableRow key={ticket.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{ticket.bookingId.slice(0, 8).toUpperCase()}</TableCell>
                <TableCell>
                  {getSlotNumber(ticket.slotId)} - {getZoneOrGate(ticket.slotId)}
                </TableCell>
                <TableCell>{formatDate(ticket.startDateTime)}</TableCell>
                <TableCell>{formatDate(ticket.endDateTime)}</TableCell>
                <TableCell>{ticket.serviceProvidedEnum}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
