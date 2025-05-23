import { useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import FloatingAddButton from "../components/SomeButton/FloatingAddButton";
import ParkingChargingDashboard from "../components/Station/ParkingChargingDashboard";
import SearchBar from "../components/ContentTop/SearchBar";
import { Box, Stack, Fade, MenuItem, Select, InputLabel, FormControl } from "@mui/material";

export default function ManageParkingCharging() {
  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === "ADMIN";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  return (
    <>
      <PageMeta title="Parking & Charging station" description="" />
      <PageBreadcrumb pageTitle="🅿️ Parking & Charging station" />

      <Box className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4 lg:p-6">
        <Stack spacing={3}>
          <Box className="bg-gray-50 p-3 rounded-lg shadow-sm">
            <Stack direction={{ xs: "column", md: "row" }} flexWrap="wrap" justifyContent="space-between" alignItems="center" spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flex={1}>
                <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="🔍 Search by location/ address" />

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <label htmlFor="status-select" style={{ fontSize: "0.875rem", fontWeight: 400 }}>
                    Filter by:
                  </label>

                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel id="status-select-label">Status</InputLabel>
                    <Select labelId="status-select-label" id="status-select" value={selectedStatus} label="Status" onChange={(e) => setSelectedStatus(e.target.value)}>
                      <MenuItem value="VALID">Active</MenuItem>
                      <MenuItem value="INVALID">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                {isAdmin && <FloatingAddButton to="/add-facility-form" />}
              </Stack>
            </Stack>
          </Box>

          <Fade in timeout={400}>
            <Box className="rounded-lg shadow-md bg-gray-50">
              <ParkingChargingDashboard searchTerm={searchTerm} statusFilter={selectedStatus} />
            </Box>
          </Fade>
        </Stack>
      </Box>
    </>
  );
}
