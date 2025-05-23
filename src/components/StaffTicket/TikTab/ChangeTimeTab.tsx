import React, { useState } from "react";
import { Paper, Stack, CircularProgress, Typography, Table, TableHead, TableBody, TableRow, TableCell, Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import SlotSelectorModal from "./Slot/SlotSelectorModal";
import { API_BASE_URL } from "../../../config";

interface ChangeTimeTabProps {
  tickets: any[];
  locationId: string;
  isLoading: boolean;
  onReassignSuccess: () => void;
}

const ChangeTimeTab: React.FC<ChangeTimeTabProps> = ({ tickets, locationId, isLoading, onReassignSuccess }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<null | "accept" | "reject">(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 5 }}>
        <CircularProgress />
      </Stack>
    );
  }

  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString("vi-VN");
  }

  const handleConfirm = async (ticket: any) => {
    const serviceProvidedEnum = ticket.ticket.serviceProvidedEnum;
    const startDateTime = ticket.ticket.startDateTime;
    const endDateTime = ticket.ticket.endDateTime;

    const url =
      `${API_BASE_URL}/app-data-service/slots/valid-by-type?` +
      `locationId=${encodeURIComponent(locationId)}` +
      `&serviceType=${encodeURIComponent(serviceProvidedEnum)}` +
      `&start=${encodeURIComponent(startDateTime)}` +
      `&end=${encodeURIComponent(endDateTime)}`;

    const token = localStorage.getItem("authToken");
    setIsFetchingSlots(true);

    try {
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      setAvailableSlots(data);
      setSelectedTicket(ticket);
      setModalOpen(true);
    } catch (error) {
      console.error("❌ Error fetching slots:", error);
    } finally {
      setIsFetchingSlots(false);
    }
  };

  const handleAccept = async (ticketId: string) => {
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(`${API_BASE_URL}/app-data-service/tickets/confirm-change-time/${ticketId}`, {
        method: "PUT",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      console.log("✅ Accept success");
      onReassignSuccess();
    } catch (err) {
      console.error("❌ Error accepting ticket:", err);
    }
  };

  const handleReject = async (ticketId: string) => {
    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(`${API_BASE_URL}/app-data-service/tickets/reject-change-time/${ticketId}`, {
        method: "PUT",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      console.log("❌ Reject success");
      onReassignSuccess();
    } catch (err) {
      console.error("❌ Error rejecting ticket:", err);
    }
  };

  const openConfirmDialog = (action: "accept" | "reject", ticketId: string) => {
    setDialogAction(action);
    setSelectedTicketId(ticketId);
    setConfirmDialogOpen(true);
  };

  const handleDialogClose = () => {
    setConfirmDialogOpen(false);
    setDialogAction(null);
    setSelectedTicketId(null);
  };

  const handleDialogConfirm = async () => {
    if (!dialogAction || !selectedTicketId) return;
    if (dialogAction === "accept") {
      await handleAccept(selectedTicketId);
    } else if (dialogAction === "reject") {
      await handleReject(selectedTicketId);
    }
    handleDialogClose();
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTicket(null);
    setAvailableSlots([]);
  };

  const handleReassignSuccess = () => {
    console.log("✅ Reassign");
    onReassignSuccess();
  };

  return (
    <>
      <Paper>
        {tickets.length === 0 ? (
          <Typography>No tickets requiring change time.</Typography>
        ) : (
          <Table sx={{ width: "100%" }}>
            <TableHead className="bg-gray-100">
              <TableRow>
                <TableCell align="center">No</TableCell>
                <TableCell align="center">Ticket ID</TableCell>
                <TableCell align="center">Lot</TableCell>
                <TableCell align="center">Start time</TableCell>
                <TableCell align="center">End time</TableCell>
                <TableCell align="center">Service</TableCell>
                <TableCell align="center">Confirm</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.map((ticket, index) => (
                <TableRow key={ticket.id}>
                  <TableCell align="center">{index + 1}</TableCell>
                  <TableCell align="center">{ticket.ticket.id.slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell align="center">{ticket.slotNumber && ticket.zoneGate ? `${ticket.slotNumber} - ${ticket.zoneGate}` : "N/A"}</TableCell>
                  <TableCell align="center">{formatDateTime(ticket.ticket.startDateTime)}</TableCell>
                  <TableCell align="center">{formatDateTime(ticket.ticket.endDateTime)}</TableCell>
                  <TableCell align="center">{ticket.ticket.serviceProvidedEnum}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button variant="contained" size="small" onClick={() => handleConfirm(ticket)} disabled={isFetchingSlots}>
                        Reassign
                      </Button>
                      <Button variant="contained" color="success" size="small" onClick={() => openConfirmDialog("accept", ticket.ticket.id)} sx={{ color: "#fff" }}>
                        Accept
                      </Button>
                      <Button variant="contained" color="error" size="small" onClick={() => openConfirmDialog("reject", ticket.ticket.id)} sx={{ color: "#fff" }}>
                        Reject
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Slot Selection Modal */}
      {selectedTicket && (
        <SlotSelectorModal
          open={modalOpen}
          onClose={handleCloseModal}
          slots={availableSlots}
          serviceType={selectedTicket.ticket.serviceProvidedEnum}
          conflictedTicketId={selectedTicket.ticket.id}
          conflictedGate={selectedTicket.zoneGate}
          onReassignSuccess={handleReassignSuccess}
        />
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to {dialogAction === "accept" ? "accept" : "reject"} the time change for this ticket?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogConfirm} color={dialogAction === "accept" ? "success" : "error"} variant="contained">
            Confirm
          </Button>
          <Button onClick={handleDialogClose} sx={{ backgroundColor: "gray", color: "white", "&:hover": { backgroundColor: "darkgray" } }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChangeTimeTab;
