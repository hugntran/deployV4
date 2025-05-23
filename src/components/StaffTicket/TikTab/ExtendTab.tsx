import React, { useState } from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  Box,
  IconButton,
  Collapse,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import SlotSelectorModal from "./Slot/SlotSelectorModal";
import { API_BASE_URL } from "../../../config";

interface TicketData {
  content: {
    parent: {
      ticket: any;
      slotNumber: string;
      zoneGate: string;
      locationName: string;
    };
    children: {
      ticket: any;
      slotNumber: string;
      zoneGate: string;
      locationName: string;
    }[];
  }[];
}

interface ExtendTabProps {
  tickets: TicketData["content"];
  onReassignSuccess: () => void;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN");
}

function ExtendTab({ tickets, onReassignSuccess }: ExtendTabProps) {
  const [openRows, setOpenRows] = useState<Record<number, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [slots, setSlots] = useState<any[]>([]);
  const [serviceType, setServiceType] = useState<"PARKING" | "CHARGING">("PARKING");
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(null);
  const [ticketToHandle, setTicketToHandle] = useState<string | null>(null);

  const toggleRow = (index: number) => {
    setOpenRows((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleReassign = async (child: any) => {
    const { locationId, serviceProvidedEnum, startDateTime, endDateTime, gate } = child.ticket;
    const token = localStorage.getItem("authToken");

    const url =
      `${API_BASE_URL}/app-data-service/slots/valid-by-type?` +
      `locationId=${encodeURIComponent(locationId)}` +
      `&serviceType=${encodeURIComponent(serviceProvidedEnum)}` +
      `&start=${encodeURIComponent(startDateTime)}` +
      `&end=${encodeURIComponent(endDateTime)}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();

      const filteredSlots = serviceProvidedEnum === "CHARGING" ? data.filter((slot: any) => slot.gate === child.zoneGate) : data;

      setSlots(filteredSlots);
      setSelectedTicketId(child.ticket.id);
      setServiceType(serviceProvidedEnum);
      setSelectedGate(gate);
      setModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch slots:", error);
    }
  };

  const handleActionClick = (action: "accept" | "reject", ticketId: string) => {
    setActionType(action);
    setTicketToHandle(ticketId);
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    const token = localStorage.getItem("authToken");
    const url =
      actionType === "accept" ? `${API_BASE_URL}/app-data-service/tickets/confirm-extension/${ticketToHandle}` : `${API_BASE_URL}/app-data-service/tickets/reject-extension/${ticketToHandle}`;

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      console.log(`${actionType} action successful`);

      setConfirmDialogOpen(false);
      onReassignSuccess();
    } catch (error) {
      console.error(`${actionType} action failed:`, error);
    }
  };

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table size="medium">
          <TableHead className="bg-gray-100">
            <TableRow>
              <TableCell>No</TableCell>
              <TableCell>Ticket ID</TableCell>
              <TableCell>Lot</TableCell>
              <TableCell>Start time</TableCell>
              <TableCell>End time</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Confirm</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.map((group, index) => {
              const parent = group.parent;
              const isOpen = openRows[index];

              return (
                <React.Fragment key={index}>
                  <TableRow>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell style={{ textTransform: "uppercase" }}>{parent.ticket.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      {parent.slotNumber} - {parent.zoneGate}
                    </TableCell>
                    <TableCell>{formatDateTime(parent.ticket.startDateTime)}</TableCell>
                    <TableCell>{formatDateTime(parent.ticket.endDateTime)}</TableCell>
                    <TableCell>{parent.ticket.serviceProvidedEnum}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => toggleRow(index)}>
                        {isOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  <TableRow className="bg-gray-100">
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                      <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <Box margin={1}>
                          {group.children.length > 0 && (
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              Conflict Ticket
                            </Typography>
                          )}
                          <Table size="medium">
                            <TableBody>
                              {group.children.map((child, i) => (
                                <React.Fragment key={`${index}-child-${i}`}>
                                  <TableRow>
                                    <TableCell />
                                    <TableCell style={{ textTransform: "uppercase" }}>{child.ticket.id.slice(0, 8)}</TableCell>
                                    <TableCell>
                                      {child.slotNumber} - {child.zoneGate}
                                    </TableCell>
                                    <TableCell>{formatDateTime(child.ticket.startDateTime)}</TableCell>
                                    <TableCell>{formatDateTime(child.ticket.endDateTime)}</TableCell>
                                    <TableCell>{child.ticket.serviceProvidedEnum}</TableCell>
                                    <TableCell>
                                      <Button
                                        variant="contained"
                                        size="small"
                                        onClick={() => handleReassign(child)}
                                        sx={{
                                          backgroundColor: "#007BFF",
                                          color: "white",
                                          "&:hover": {
                                            backgroundColor: "#0069d9",
                                          },
                                        }}
                                      >
                                        Change slot
                                      </Button>
                                    </TableCell>
                                  </TableRow>

                                  <TableRow>
                                    <TableCell colSpan={8} style={{ textAlign: "right" }}>
                                      <Button
                                        variant="contained"
                                        size="small"
                                        color="primary"
                                        onClick={() => handleActionClick("accept", parent.ticket.id)}
                                        sx={{ backgroundColor: "#4CAF50", marginRight: 2 }}
                                      >
                                        Accept
                                      </Button>

                                      <Button variant="contained" size="small" color="secondary" onClick={() => handleActionClick("reject", parent.ticket.id)} sx={{ backgroundColor: "#d33" }}>
                                        Reject
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                </React.Fragment>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>Are you sure you want to {actionType} the extension request?</DialogContent>
        <DialogActions>
          <Button
            onClick={handleConfirmAction}
            sx={{
              backgroundColor: "#4CAF50",
              color: "white",
              "&:hover": {
                backgroundColor: "#45A049",
              },
            }}
          >
            Confirm
          </Button>

          <Button
            onClick={() => setConfirmDialogOpen(false)}
            sx={{
              backgroundColor: "#d33",
              color: "white",
              "&:hover": {
                backgroundColor: "#b22a2a",
              },
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <SlotSelectorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        slots={slots}
        serviceType={serviceType}
        conflictedTicketId={selectedTicketId}
        onReassignSuccess={onReassignSuccess}
        conflictedGate={selectedGate}
      />
    </Box>
  );
}

export default ExtendTab;
