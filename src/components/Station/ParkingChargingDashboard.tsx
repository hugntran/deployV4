import { useState } from "react";
import clsx from "clsx";
import ChargingStationList from "./ChargingStationList";
import IntegratedFacilityList from "./IntegratedFacilityList";
import ParkingLotList from "./ParkingLotList";
import Pagination from "../ContentBottom/Pagination";
import { Fade } from "@mui/material";
import { useFetchData } from "../../hooks/useFetchData";
import { API_BASE_URL } from "../../config";

interface Location {
  id: string;
  name: string;
  address: string;
  totalChargingSlots: number;
  totalParkingSlots: number;
  locationStatus: string;
  chargingGateDistribution: Record<string, number>;
  services: string[];
}

interface ParkingChargingDashboardProps {
  searchTerm?: string;
  statusFilter?: string;
}

const ParkingChargingDashboard: React.FC<ParkingChargingDashboardProps> = ({ searchTerm = "", statusFilter = "" }) => {
  const [activeTab, setActiveTab] = useState("parking");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const {
    data: locations,
    loading,
    error,
  } = useFetchData<Location>({
    url: `${API_BASE_URL}/app-data-service/locations/nearby?longitude=105.779303&latitude=21.028759&maxDistance=100&page=0&size=100`,
    filterFn: (content) =>
      content.map((loc: any) => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        totalChargingSlots: loc.totalChargingSlots,
        totalParkingSlots: loc.totalParkingSlots,
        locationStatus: loc.locationStatus,
        chargingGateDistribution: loc.chargingGateDistribution,
        services: loc.services,
      })),
  });

  const filteredLocations = (locations || []).filter((loc) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = loc.name.toLowerCase().includes(term) || loc.address.toLowerCase().includes(term);

    const matchesStatus = statusFilter ? loc.locationStatus === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  const parkingLocations = filteredLocations.filter((loc) => loc.services.includes("PARKING") && !loc.services.includes("CHARGING"));
  const chargingLocations = filteredLocations.filter((loc) => loc.services.includes("CHARGING") && !loc.services.includes("PARKING"));
  const combinedLocations = filteredLocations.filter((loc) => loc.services.includes("PARKING") && loc.services.includes("CHARGING"));

  const paginatedLocations = (locations: Location[]) => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return locations.slice(start, end);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto bg-white shadow-lg rounded-lg">
      <div className="flex justify-center space-x-4">
        <button
          className={clsx("px-6 py-2 font-medium border-b-4 transition-all", activeTab === "parking" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-blue-500")}
          onClick={() => handleTabChange("parking")}
        >
          Parking
        </button>

        <button
          className={clsx("px-6 py-2 font-medium border-b-4 transition-all", activeTab === "charging" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-blue-500")}
          onClick={() => handleTabChange("charging")}
        >
          Charging
        </button>

        <button
          className={clsx("px-6 py-2 font-medium border-b-4 transition-all", activeTab === "combined" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-blue-500")}
          onClick={() => handleTabChange("combined")}
        >
          Integrated Parking
        </button>
      </div>

      <div className="border rounded-lg shadow-md bg-gray-50 p-4 relative min-h-[200px]">
        {loading && <p>Loading locations...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        <Fade in={activeTab === "parking"} timeout={300} unmountOnExit>
          <div hidden={activeTab !== "parking"}>
            <ParkingLotList locations={paginatedLocations(parkingLocations)} />
            <Pagination currentPage={currentPage} totalPages={Math.ceil(parkingLocations.length / itemsPerPage)} onPageChange={setCurrentPage} />
          </div>
        </Fade>

        <Fade in={activeTab === "charging"} timeout={300} unmountOnExit>
          <div hidden={activeTab !== "charging"}>
            <ChargingStationList locations={paginatedLocations(chargingLocations)} />
            <Pagination currentPage={currentPage} totalPages={Math.ceil(chargingLocations.length / itemsPerPage)} onPageChange={setCurrentPage} />
          </div>
        </Fade>

        <Fade in={activeTab === "combined"} timeout={300} unmountOnExit>
          <div hidden={activeTab !== "combined"}>
            <IntegratedFacilityList locations={paginatedLocations(combinedLocations)} />
            <Pagination currentPage={currentPage} totalPages={Math.ceil(combinedLocations.length / itemsPerPage)} onPageChange={setCurrentPage} />
          </div>
        </Fade>
      </div>
    </div>
  );
};

export default ParkingChargingDashboard;
