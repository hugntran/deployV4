import { useEffect, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import InvoicePage from "../components/Invoice/InvoicePage";
import SearchBar from "../components/ContentTop/SearchBar";
import { fetchWithAuth } from "../api/fetchWithAuth";
import DateRangeFilter from "../components/ContentTop/DateRangeFilter";
import { API_BASE_URL } from "../config";

interface Location {
  id: string;
  name: string;
}

export default function ManageInvoice() {
  const [searchValue, setSearchValue] = useState("");
  const [locationOptions, setLocationOptions] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");

  const [selectedType, setSelectedType] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleSearchChange = (value: string) => setSearchValue(value);
  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedLocationId(e.target.value);
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedType(e.target.value);

  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleQuickSelect = (type: string) => {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    switch (type) {
      case "today": {
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "thisWeek": {
        const day = now.getDay();
        const diffToMonday = day === 0 ? 6 : day - 1;

        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        start.setDate(now.getDate() - diffToMonday);

        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        end.setDate(start.getDate() + 6);
        break;
      }
      case "thisMonth": {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);

        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      }
      case "thisYear": {
        start = new Date(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);

        end = new Date(now.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);
        break;
      }
    }

    setStartDate(start);
    setEndDate(end);
  };

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const pageSize = 100;
        let allLocations: Location[] = [];
        let page = 0;
        let totalElements = 0;

        do {
          const res = await fetchWithAuth<{ content: Location[]; totalElements: number }>(
            `${API_BASE_URL}/app-data-service/locations/nearby?longitude=105.779303&latitude=21.028759&maxDistance=100&page=${page}&size=${pageSize}`
          );
          allLocations = [...allLocations, ...res.content];
          totalElements = res.totalElements;
          page++;
        } while (allLocations.length < totalElements);

        setLocationOptions(allLocations);
      } catch (error) {
        console.error("Error fetching locations", error);
      }
    };

    fetchLocations();
  }, []);

  return (
    <>
      <PageMeta title="Invoice" description="" />
      <PageBreadcrumb pageTitle="🧾 Invoice" />
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-6">
          {/* Filter Panel */}
          <div className="flex flex-col gap-4 bg-gray-50 p-5 rounded-lg shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-semibold mb-1">Search by Invoice ID</label>
                <SearchBar value={searchValue} onChange={handleSearchChange} placeholder="🔍 Search by Invoice ID" />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold mb-1">Filter by time:</label>
                <DateRangeFilter startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} onQuickSelect={handleQuickSelect} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-semibold mb-1">Filter by transaction type:</label>
                <select className="border border-gray-300 rounded-md p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={selectedType} onChange={handleTypeChange}>
                  <option value="">All Types</option>
                  <option value="EXTEND_BOOKING_PAYMENT">Extend Booking Payment</option>
                  <option value="BOOKING_PAYMENT">Booking Payment</option>
                  <option value="TIME_CHANGE_PAYMENT">Time Change Payment</option>
                  <option value="OVERTIME_FINE_PAYMENT">Overtime Fine Payment</option>
                </select>
              </div>

              {/* Date Range */}

              <div>
                <label className="block text-sm font-semibold mb-1">Filter by location:</label>
                <select className="border border-gray-300 rounded-md p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={selectedLocationId} onChange={handleLocationChange}>
                  <option value="">All Locations</option>
                  {locationOptions.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Invoice List */}
          <div className="rounded-lg shadow-md bg-gray-50">
            <InvoicePage
              searchQuery={searchValue}
              locationFilter={selectedLocationId}
              typeFilter={selectedType}
              fromDate={startDate ? formatDateLocal(startDate) : ""}
              toDate={endDate ? formatDateLocal(endDate) : ""}
            />
          </div>
        </div>
      </div>
    </>
  );
}
