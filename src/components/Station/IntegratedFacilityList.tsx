import React from "react";
import classNames from "classnames";

interface Location {
  id: string;
  name: string;
  address: string;
  totalParkingSlots: number;
  totalChargingSlots: number;
  chargingGateDistribution: Record<string, number>;
  locationStatus: string;
}

interface IntegratedFacilityListProps {
  locations: Location[];
}

const statusColorMap: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-gray-100 text-gray-700",
};

const IntegratedFacilityList: React.FC<IntegratedFacilityListProps> = ({ locations }) => {
  return (
    <div className="overflow-x-auto">
      {locations.length === 0 ? (
        <div className="text-center text-gray-500 py-4">No integrated facilities available</div>
      ) : (
        <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-left">
              <th className="px-4 py-3 border-b">No</th>
              <th className="px-4 py-3 border-b">Location</th>
              <th className="px-4 py-3 border-b">Address</th>
              <th className="px-4 py-3 border-b">Parking lots</th>
              <th className="px-4 py-3 border-b">Charging lots</th>
              <th className="px-4 py-3 border-b">Charging gate</th>
              <th className="px-4 py-3 border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((location, index) => {
              const isActive = location.locationStatus === "VALID";
              const displayStatus = isActive ? "ACTIVE" : "INACTIVE";
              const badgeClass = statusColorMap[displayStatus];

              return (
                <tr key={location.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-gray-100"}>
                  <td className="px-4 py-2 border-b">{index + 1}</td>
                  <td className="px-4 py-2 border-b">{location.name}</td>
                  <td className="px-4 py-2 border-b truncate max-w-xs">{location.address}</td>
                  <td className="px-4 py-2 border-b text-center">{location.totalParkingSlots}</td>
                  <td className="px-4 py-2 border-b text-center">{location.totalChargingSlots}</td>
                  <td className="px-4 py-2 border-b">
                    <div className="text-sm">
                      {Object.entries(location.chargingGateDistribution)
                        .map(([key, value]) => `${key}: ${value} lots`)
                        .join(", ")}
                    </div>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <span className={classNames("px-2 py-1 text-xs font-semibold rounded-full", badgeClass)}>{displayStatus}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default IntegratedFacilityList;
