import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Box, Typography, FormControlLabel, Checkbox, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Stack } from "@mui/material";
import { toast } from "react-toastify";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { LeafletMouseEvent } from "leaflet";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { SearchIcon } from "lucide-react";

// Fix marker icon not showing
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

const MapClickHandler = ({ setCoordinates, setAddress }: { setCoordinates: React.Dispatch<React.SetStateAction<[number, number]>>; setAddress: React.Dispatch<React.SetStateAction<string>> }) => {
  useMapEvents({
    click: async (e: LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setCoordinates([lat, lng]);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        setAddress(data.display_name || "");
      } catch (error) {
        toast.error("Failed to fetch address from map click");
      }
    },
  });
  return null;
};

const MapCenterUpdater = ({ coordinates }: { coordinates: [number, number] }) => {
  const map = useMapEvents({});
  React.useEffect(() => {
    map.setView(coordinates);
  }, [coordinates, map]);

  return null;
};

const AddFacilityForm = () => {
  const [name, setName] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [address, setAddress] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [totalParkingSlots, setTotalParkingSlots] = useState(0);
  const [coordinates, setCoordinates] = useState<[number, number]>([21.028658, 105.781899]);
  const [services, setServices] = useState<string[]>([]);
  const [chargingGateDistribution, setChargingGateDistribution] = useState({
    "11W": 0,
    "22W": 0,
    "50W": 0,
    "100W": 0,
  });
  const [openConfirm, setOpenConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toggleService = (service: string) => {
    setServices((prev) => (prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Missing token!");
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    setUploadingImages(true); // upload
    try {
      const response = await axios.post(`${API_BASE_URL}/file/aws/upload-images`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      const urls = Array.isArray(response.data) ? response.data.filter((item: any) => item).map((item: any) => item) : [];
      if (!urls.length) throw new Error("No valid image URLs returned");

      setImages((prev) => [...prev, ...urls]);
      toast.success("Images uploaded successfully!");
    } catch (error) {
      toast.error("Upload failed: " + (error as Error).message);
    } finally {
      setUploadingImages(false); //finish upload
    }
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const validateForm = () => {
    if (!name.trim() || !address.trim()) {
      toast.error("Name and address are required");
      return false;
    }
    if (services.includes("PARKING") && totalParkingSlots <= 0) {
      toast.error("Total parking slots must be greater than 0");
      return false;
    }

    // Validate Charging Gate distribution
    if (services.includes("CHARGING")) {
      const totalChargingSlots = Object.values(chargingGateDistribution).reduce((acc, value) => acc + value, 0);
      if (totalChargingSlots <= 0) {
        toast.error("Total charging slots must be greater than 0");
        return false;
      }
    }

    return true;
  };

  const submitConfirmed = async () => {
    setOpenConfirm(false);
    if (!validateForm()) return;
    setLoading(true);

    const locationData = {
      name,
      address,
      images,
      coordinates: [coordinates[1], coordinates[0]],
      locationStatus: "VALID",
      services,
      ...(services.includes("PARKING") && { totalParkingSlots }),
      ...(services.includes("CHARGING") && { chargingGateDistribution }),
    };

    console.log("Payload being sent to the server:", JSON.stringify(locationData));

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Missing token!");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/app-data-service/locations/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(locationData),
      });

      if (!response.ok) throw new Error("Failed to create location");

      toast.success("Location created successfully!");
      navigate("/manage-parking-charging");
    } catch (error) {
      toast.error("Error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const geocodeAddress = async (address: string) => {
    if (!address.trim()) return;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        setCoordinates([parseFloat(lat), parseFloat(lon)]);
        toast.success("Coordinates found successfully");
      } else {
        toast.error("Address not found");
      }
    } catch (error) {
      toast.error("Failed to fetch coordinates from address");
    }
  };

  const handleSearchClick = () => {
    geocodeAddress(address);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Create New Location
      </Typography>

      {/* Section: Basic Info */}
      <Typography variant="h6" mt={3}>
        Basic Information
      </Typography>
      <TextField label="Location Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} margin="normal" required />
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField label="Address" fullWidth value={address} onChange={(e) => setAddress(e.target.value)} margin="normal" />
        <Button
          variant="outlined"
          startIcon={<SearchIcon />}
          onClick={handleSearchClick}
          sx={{
            height: "56px",
            borderRadius: "12px",
            padding: "8px 20px",
            textTransform: "none",
            fontWeight: 500,
            fontSize: "16px",
            backgroundColor: "#1976d2",
            color: "#fff",
            borderColor: "#1976d2",
            "&:hover": {
              backgroundColor: "transparent",
              color: "#1976d2",
              borderColor: "#1976d2",
            },
          }}
        >
          Search
        </Button>
      </Stack>

      {/* Map Picker */}
      <Typography variant="h6" mt={3}>
        Select Location
      </Typography>
      <Box height={400} mb={2}>
        <MapContainer center={coordinates} zoom={15} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler setCoordinates={setCoordinates} setAddress={setAddress} />
          <MapCenterUpdater coordinates={coordinates} />
          <Marker position={coordinates} />
        </MapContainer>
      </Box>

      {/* Section: Coordinates */}
      <TextField label="Latitude" hidden type="number" fullWidth value={coordinates[0]} onChange={(e) => setCoordinates([Number(e.target.value), coordinates[1]])} margin="normal" />
      <TextField label="Longitude" hidden type="number" fullWidth value={coordinates[1]} onChange={(e) => setCoordinates([coordinates[0], Number(e.target.value)])} margin="normal" />

      {/* Section: Images */}
      <Typography variant="h6" mt={3}>
        Upload Images
      </Typography>
      <input type="file" accept="image/*" multiple onChange={handleImageUpload} ref={fileInputRef} style={{ display: "none" }} />

      <Box
        onClick={handleUploadAreaClick}
        sx={{
          border: "2px dashed #1976d2",
          borderRadius: 2,
          padding: 3,
          textAlign: "center",
          color: "#1976d2",
          cursor: "pointer",
          "&:hover": {
            backgroundColor: "#e3f2fd",
          },
          userSelect: "none",
        }}
      >
        <Typography>Click here or drag images to upload</Typography>
        <Typography variant="caption" color="textSecondary">
          You can select multiple images
        </Typography>
      </Box>

      <Box display="flex" flexWrap="wrap" gap={2} mt={2}>
        {images.map((url, index) => (
          <Box key={index} width={100} height={100} sx={{ position: "relative" }}>
            <img src={url} alt={`Uploaded ${index}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
          </Box>
        ))}
      </Box>

      {/* Section: Services */}
      <Typography variant="h6" mt={3}>
        Service provided
      </Typography>
      <FormControlLabel control={<Checkbox checked={services.includes("PARKING")} onChange={() => toggleService("PARKING")} />} label="Parking" />
      <FormControlLabel control={<Checkbox checked={services.includes("CHARGING")} onChange={() => toggleService("CHARGING")} />} label="Charging" />

      {/* Parking */}
      {services.includes("PARKING") && (
        <TextField
          label="Total Parking Slots"
          type="number"
          fullWidth
          value={totalParkingSlots}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (value > 0) setTotalParkingSlots(value);
            else setTotalParkingSlots(0);
          }}
          inputProps={{ min: 1 }}
          margin="normal"
        />
      )}

      {/* Charging */}
      {services.includes("CHARGING") && (
        <>
          <Typography variant="h6" mt={3}>
            Charging Gate Distribution
          </Typography>
          {["11W", "22W", "50W", "100W"].map((watt) => (
            <TextField
              key={watt}
              label={watt}
              type="number"
              fullWidth
              value={chargingGateDistribution[watt as keyof typeof chargingGateDistribution]}
              onChange={(e) => {
                const value = Number(e.target.value);
                setChargingGateDistribution((prev) => ({
                  ...prev,
                  [watt]: value > 0 ? value : 0,
                }));
              }}
              inputProps={{ min: 1 }}
              margin="normal"
            />
          ))}
        </>
      )}

      {/* Submit */}
      <Box display="flex" justifyContent="right" mt={3}>
        <Button variant="contained" onClick={() => setOpenConfirm(true)} disabled={loading || uploadingImages} startIcon={loading || uploadingImages ? <CircularProgress size={20} /> : null}>
          {loading || uploadingImages ? "Submitting..." : "Create Location"}
        </Button>
        <Button
          variant="contained"
          onClick={() => window.history.back()}
          disabled={loading}
          sx={{
            marginLeft: "10px",
            backgroundColor: "#d33",
            color: "white",
            "&:hover": {
              backgroundColor: "#c12",
            },
          }}
        >
          Back
        </Button>
      </Box>

      <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
        <DialogTitle>Confirm Location Creation</DialogTitle>
        <DialogContent>Are you sure you want to create this new location?</DialogContent>
        <DialogActions>
          <Button onClick={submitConfirmed} autoFocus variant="contained">
            Confirm
          </Button>
          <Button onClick={() => setOpenConfirm(false)} sx={{ backgroundColor: "#d33", color: "white", "&:hover": { backgroundColor: "#a00" } }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddFacilityForm;
