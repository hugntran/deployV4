import { useState, useEffect } from "react";
import DateRangeFilter from "../ContentTop/DateRangeFilter";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js";
import MonthlySalesChart from "./MonthlySalesChart";
import RecentTransactions from "./RecentTransactions";
import TopLocationsTable from "./TopLocationsTable";
import StaffRevenueTable from "./StaffRevenueTable";
import { API_BASE_URL } from "../../config";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function EcommerceMetrics() {
  const now = new Date();
  const defaultStartOfYear = new Date(now.getFullYear(), 0, 1);
  defaultStartOfYear.setHours(0, 0, 0, 0);

  const defaultEndOfYear = new Date(now.getFullYear(), 11, 31);
  defaultEndOfYear.setHours(23, 59, 59, 999);

  const [invoiceCount, setInvoiceCount] = useState<number | null>(null);
  const [refundCount, setRefundCount] = useState<number | null>(null);
  const [bookingCount, setBookingCount] = useState<number | null>(null);
  const [complaintCount, setComplaintCount] = useState<number>(0);
  const [startDate, setStartDate] = useState<Date | null>(defaultStartOfYear);
  const [endDate, setEndDate] = useState<Date | null>(defaultEndOfYear);

  const [locationId, setLocationId] = useState<string>("");

  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-CA");
  };

  const fetchLocations = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const latitude = 21.028759;
      const longitude = 105.779303;
      const response = await fetch(`${API_BASE_URL}/app-data-service/locations/nearby?longitude=${longitude}&latitude=${latitude}&maxDistance=100&page=0&size=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setLocations(data.content.map((item: any) => ({ id: item.id, name: item.name })));
    } catch (err) {
      console.error("Error fetching locations", err);
    }
  };

  const fetchInvoiceAndRefundCount = async (fromDate?: string, toDate?: string, locationId?: string) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      if (locationId) params.append("locationId", locationId);
      const response = await fetch(`${API_BASE_URL}/app-data-service/bookings/stats/counts?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setInvoiceCount(data.invoices ?? 0);
      setRefundCount(data.refunds ?? 0);
      setBookingCount(data.bookings ?? 0);
    } catch (err) {
      console.error("Error fetching counts", err);
    }
  };

  const fetchComplaintCount = async (fromDate?: string, toDate?: string) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      const response = await fetch(`${API_BASE_URL}/dispute/api/stats/counts?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setComplaintCount(data?.disputes ?? 0);
    } catch (err) {
      console.error("Error fetching complaint count", err);
    }
  };

  useEffect(() => {
    fetchLocations();
    handleQuickSelect("thisYear");
  }, []);

  useEffect(() => {
    const fromDate = startDate ? formatDate(startDate) : undefined;
    const toDate = endDate ? formatDate(endDate) : undefined;

    fetchInvoiceAndRefundCount(fromDate, toDate, locationId || undefined);
    fetchComplaintCount(fromDate, toDate);
  }, [startDate, endDate, locationId]);

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

    if (start) setStartDate(start);
    if (end) setEndDate(end);
  };

  const doughnutData = {
    labels: ["Invoices", "Refunds"],
    datasets: [
      {
        label: "Count",
        data: [invoiceCount ?? 0, refundCount ?? 0],
        backgroundColor: ["#3b82f6", "#ef4444"],
        hoverOffset: 20,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div className="col-span-2 flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Location:</label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
          >
            <option value="">All</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Date:</label>
          <DateRangeFilter startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} onQuickSelect={handleQuickSelect} />
        </div>
      </div>

      {/* Invoices vs Refunds */}
      <div className="col-span-2 rounded-2xl border border-gray-300 bg-white p-8 shadow-md dark:border-gray-700 dark:bg-gray-900">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 tracking-wide">Invoices vs Refunds</h2>
        <div className="flex gap-8 items-center">
          <div className="w-[40%] flex flex-col md:flex-row items-center justify-between gap-8 border-r border-gray-200 dark:border-gray-700 pr-8">
            <div className="flex flex-col space-y-4 text-center md:text-left flex-1">
              <div className="flex items-center space-x-3">
                <span className="w-4 h-4 rounded-full bg-blue-500 inline-block shadow-md"></span>
                <h3 className="text-2xl font-semibold text-blue-600 dark:text-blue-400">{invoiceCount ?? "Loading..."}</h3>
                <span className="text-base text-gray-600 dark:text-gray-400 font-medium">Invoices</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-4 h-4 rounded-full bg-red-500 inline-block shadow-md"></span>
                <h3 className="text-2xl font-semibold text-red-600 dark:text-red-400">{refundCount ?? "Loading..."}</h3>
                <span className="text-base text-gray-600 dark:text-gray-400 font-medium">Refunds</span>
              </div>
            </div>

            <div className="w-44 h-44 shadow-lg rounded-full p-2 bg-white dark:bg-gray-900">
              <Doughnut data={doughnutData} />
            </div>
          </div>

          <div className="w-[30%] flex flex-col justify-center items-center bg-green-50 dark:bg-green-900 rounded-2xl p-6 shadow-md">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3 tracking-wide">📅 Booking</h2>
            <h3 className="text-3xl font-extrabold text-green-700 dark:text-green-400">{bookingCount ?? "Loading..."}</h3>
            <span className="text-lg font-semibold text-green-700 dark:text-green-300">Bookings</span>
          </div>

          <div className="w-[30%] flex flex-col justify-center items-center bg-yellow-50 dark:bg-yellow-900 rounded-2xl p-6 shadow-md">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3 tracking-wide">📋 Complaint</h2>
            <h3 className="text-3xl font-extrabold text-yellow-700 dark:text-yellow-400">{complaintCount ?? "Loading..."}</h3>
            <span className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">Complaints</span>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart & Top Locations Table */}
      <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-300 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 tracking-wide">📈 Monthly Revenue</h2>
          <MonthlySalesChart startDate={startDate} endDate={endDate} locationId={locationId} />
        </div>

        <div className="rounded-2xl border border-gray-300 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 tracking-wide">🏢 Top Locations</h2>
          <TopLocationsTable fromDate={startDate ? formatDate(startDate) : undefined} toDate={endDate ? formatDate(endDate) : undefined} />
        </div>
      </div>

      <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-300 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-900">
          <RecentTransactions />
        </div>
        <div className="rounded-2xl border border-gray-300 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-900">
          <StaffRevenueTable startDate={startDate} endDate={endDate} />
        </div>
      </div>
    </div>
  );
}
