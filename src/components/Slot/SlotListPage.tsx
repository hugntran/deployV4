import { useState, useEffect } from "react";
import { Box, Typography, CircularProgress, Select, MenuItem, FormControl, InputLabel, Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import axios from "axios";
import { API_BASE_URL } from "../../config";

const SlotListPage = () => {
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);

  const getToken = () => localStorage.getItem("authToken");

  const fetchLocations = async () => {
    setLoadingLocations(true);
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/app-data-service/locations/nearby`, {
        params: {
          longitude: 105.779303,
          latitude: 21.028759,
          maxDistance: 100,
          page: 0,
          size: 100,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocations(response.data.content || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchSlots = async (locationId: string) => {
    setLoadingSlots(true);
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/app-data-service/slots/find-pageable-slots`, {
        params: { page: 0, size: 1000, locationId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setSlots(response.data.content || []);
    } catch (error) {
      console.error("Error fetching slots:", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const updateSlotStatus = async (slot: any) => {
    const newStatus = slot.status === "VALID" ? "INVALID" : "VALID";
    try {
      const token = getToken();
      await axios.put(
        `${API_BASE_URL}/app-data-service/slots/status/${slot.id}`,
        {
          status: newStatus,
          description: "Slot status toggled",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (selectedLocationId) {
        await fetchSlots(selectedLocationId); // Refresh data
      }
    } catch (error) {
      console.error("Error toggling slot status:", error);
    }
  };

  const handleSlotClick = (slot: any) => {
    setSelectedSlot(slot);
    setConfirmDialogOpen(true);
  };

  const handleConfirm = () => {
    if (selectedSlot) {
      updateSlotStatus(selectedSlot);
    }
    setConfirmDialogOpen(false);
    setSelectedSlot(null);
  };

  const handleCancel = () => {
    setConfirmDialogOpen(false);
    setSelectedSlot(null);
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (selectedLocationId) {
      fetchSlots(selectedLocationId);
    }
  }, [selectedLocationId]);

  const organizeSlots = (slots: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    slots.forEach((slot) => {
      const key = slot.type === "PARKING" ? slot.zone : slot.gate;
      if (!key) return;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(slot);
    });
    return grouped;
  };

  const groupedSlots = organizeSlots(slots);

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 2 }}>
      {/* Use Box with display flex to arrange Location Select and color legend on the same row */}
      <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
        <FormControl fullWidth margin="normal" sx={{ flexGrow: 1 }}>
          <InputLabel>Location</InputLabel>
          <Select value={selectedLocationId || ""} onChange={(e) => setSelectedLocationId(e.target.value)} label="Location">
            {locations.map((location) => (
              <MenuItem key={location.id} value={location.id}>
                {location.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Add color legend next to select */}
        <Box sx={{ ml: 2, display: "flex", alignItems: "center" }}>
          <Typography variant="body2" display="flex" alignItems="center" sx={{ marginRight: 2 }}>
            <Box sx={{ width: 16, height: 16, backgroundColor: "#A5D6A7", marginRight: 1 }} />
            Available
          </Typography>
          <Typography variant="body2" display="flex" alignItems="center">
            <Box sx={{ width: 16, height: 16, backgroundColor: "#BDBDBD", marginRight: 1 }} />
            Out of Service
          </Typography>
        </Box>
      </Box>

      {loadingLocations ? (
        <CircularProgress />
      ) : (
        <>
          {loadingSlots ? (
            <CircularProgress />
          ) : (
            <Box>
              <Box display="flex" flexDirection="column">
                {Object.entries(groupedSlots).map(([key, group]) => (
                  <Box key={key} sx={{ mb: 2 }}>
                    <Typography variant="h6">
                      {group[0]?.type === "CHARGING" ? "Gate" : "Zone"} {key}
                    </Typography>
                    <Box display="flex" flexWrap="wrap">
                      {group.map((slot: any) => (
                        <Box
                          key={slot.id}
                          onClick={() => handleSlotClick(slot)}
                          sx={{
                            width: "70px",
                            height: "70px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            border: "2px solid",
                            margin: "8px",
                            backgroundColor: slot.status === "VALID" ? "#A5D6A7" : "#BDBDBD",
                            color: "#fff",
                            cursor: "pointer",
                            borderRadius: "8px",
                            fontWeight: "bold",
                            fontSize: "14px",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                            transition: "background-color 0.3s ease",
                            "&:hover": {
                              backgroundColor: slot.status === "VALID" ? "#81C784" : "#9E9E9E",
                            },
                          }}
                        >
                          <Typography variant="body2">{slot.slotNumber}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleCancel}>
        <DialogTitle>Confirm Status Change</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to change the status of slot <strong>{selectedSlot?.slotNumber}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="primary"
            sx={{
              backgroundColor: "#4CAF50",
              color: "#fff",
              "&:hover": {
                backgroundColor: "#388E3C",
              },
            }}
          >
            Confirm
          </Button>
          <Button
            onClick={handleCancel}
            sx={{
              backgroundColor: "#BDBDBD",
              color: "#fff",
              "&:hover": {
                backgroundColor: "#9E9E9E",
              },
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SlotListPage;
