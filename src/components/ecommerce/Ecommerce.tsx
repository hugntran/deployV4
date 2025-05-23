import { useState, useEffect } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js";
import UpcomingEco from "./UpcomingEco";
import { API_BASE_URL } from "../../config";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Ecommerce() {
  const formatLocalDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    const dd = date.getDate().toString().padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [checkinCount, setCheckinCount] = useState<number | null>(null);
  const [checkoutCountInMay, setCheckoutCountInMay] = useState<number | null>(null);

  const parseJwt = (token: string) => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  };

  const fetchTotalRevenue = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const payload = parseJwt(token);
    const staffId = payload?.userId;
    if (!staffId) return;

    const today = formatLocalDate(new Date());

    const params = new URLSearchParams({
      groupType: "day",
      fromDate: today,
      toDate: today,
      staffId: staffId,
    });

    setLoadingRevenue(true);
    try {
      const res = await fetch(`${API_BASE_URL}/app-data-service/api/invoices/revenue/grouped?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        console.error("Error fetching revenue:", res.statusText);
        setTotalRevenue(null);
        return;
      }

      const data = await res.json();
      const sum = data.reduce((acc: number, item: any) => acc + (item.totalRevenue || 0), 0);
      setTotalRevenue(sum);
    } catch (error) {
      console.error("Fetch revenue error:", error);
      setTotalRevenue(null);
    } finally {
      setLoadingRevenue(false);
    }
  };

  const fetchCheckinCount = async () => {
    const token = localStorage.getItem("authToken");
    const locationId = localStorage.getItem("locationId");
    if (!token || !locationId) return;

    try {
      let page = 0;
      const size = 100;
      let allData: any[] = [];
      let hasMore = true;

      while (hasMore) {
        const res = await fetch(`${API_BASE_URL}/app-data-service/tickets/checkin-requests?page=${page}&size=${size}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          console.error("Error fetching checkin requests:", res.statusText);
          return;
        }

        const data = await res.json();

        if (data.content && data.content.length > 0) {
          allData = allData.concat(data.content);
          page += 1;

          if (page * size >= data.totalElements) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      const filteredData = allData.filter((item: any) => item.ticket?.locationId === locationId);

      const uniqueTicketsMap = new Map();
      const targetDate = new Date();

      filteredData.forEach((item: any) => {
        const ticketId = item.ticket?.id;
        const updatedAt = new Date(item.updatedAt);

        const isSameDay = updatedAt.getFullYear() === targetDate.getFullYear() && updatedAt.getMonth() === targetDate.getMonth() && updatedAt.getDate() === targetDate.getDate();

        if (ticketId && item.ticket?.isCheckIn === true && isSameDay && !uniqueTicketsMap.has(ticketId)) {
          uniqueTicketsMap.set(ticketId, item);
        }
      });

      setCheckinCount(uniqueTicketsMap.size);
    } catch (err) {
      console.error("Error fetching checkin count", err);
    }
  };

  const fetchCheckoutCountInMay = async () => {
    const token = localStorage.getItem("authToken");
    const locationId = localStorage.getItem("locationId");
    if (!token || !locationId) return;

    try {
      let page = 0;
      const size = 100;
      let allData: any[] = [];
      let hasMore = true;

      while (hasMore) {
        const res = await fetch(`${API_BASE_URL}/app-data-service/tickets/checkout-requests?page=${page}&size=${size}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          console.error("Error fetching checkout requests:", res.statusText);
          return;
        }

        const data = await res.json();

        if (data.content && data.content.length > 0) {
          allData = allData.concat(data.content);
          page += 1;

          if (page * size >= data.totalElements) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      const targetDate = new Date();
      const toDateStr = (date: Date) => date.toISOString().split("T")[0];

      const filteredData = allData.filter((item: any) => item.ticket?.locationId === locationId);

      const uniqueTicketsMap = new Map();

      filteredData.forEach((item: any) => {
        const ticketId = item.ticket?.id;
        const updatedAt = new Date(item.updatedAt);

        const isSameDay = toDateStr(updatedAt) === toDateStr(targetDate);

        if (ticketId && item.ticket?.isCheckOut === true && isSameDay && !uniqueTicketsMap.has(ticketId)) {
          uniqueTicketsMap.set(ticketId, item);
        }
      });

      setCheckoutCountInMay(uniqueTicketsMap.size);
    } catch (err) {
      console.error("Error fetching checkout count", err);
    }
  };

  const [changeTimePaymentCount, setChangeTimePaymentCount] = useState<number | null>(null);
  const [extendBookingPaymentCount, setExtendBookingPaymentCount] = useState<number | null>(null);

  const fetchChangeTimePaymentCount = async () => {
    const token = localStorage.getItem("authToken");
    const locationId = localStorage.getItem("locationId");
    if (!token || !locationId) return;

    try {
      const today = formatLocalDate(new Date());

      const params = new URLSearchParams();
      params.set("fromDate", today);
      params.set("toDate", today);
      params.set("searchText", "TIME_CHANGE_PAYMENT");
      params.set("locationId", locationId);

      const response = await fetch(`${API_BASE_URL}/app-data-service/api/invoices?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      setChangeTimePaymentCount(data?.totalElements ?? 0);
    } catch (err) {
      console.error("Error fetching Time Change Payment count", err);
    }
  };

  const fetchExtendBookingPaymentCount = async () => {
    const token = localStorage.getItem("authToken");
    const locationId = localStorage.getItem("locationId");
    if (!token || !locationId) return;

    try {
      const today = formatLocalDate(new Date());

      const params = new URLSearchParams();
      params.set("fromDate", today);
      params.set("toDate", today);
      params.set("searchText", "EXTEND_BOOKING_PAYMENT");
      params.set("locationId", locationId);

      const response = await fetch(`${API_BASE_URL}/app-data-service/api/invoices?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Error fetching Extend Booking Payment count:", response.statusText);
        return;
      }

      const data = await response.json();
      setExtendBookingPaymentCount(data?.totalElements ?? 0);
    } catch (err) {
      console.error("Error fetching Extend Booking Payment count", err);
    }
  };

  useEffect(() => {
    fetchChangeTimePaymentCount();
    fetchExtendBookingPaymentCount();
    fetchTotalRevenue();
    fetchCheckoutCountInMay();
    fetchCheckinCount();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-1">
      <div className="col-span-1 rounded-2xl border border-gray-300 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-wrap justify-between gap-6">
          {/* Checkouted Cars in May */}
          <div className="flex-1 min-w-[180px] max-w-[22%] flex flex-col items-center bg-green-50 dark:bg-green-900 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
            <h2 className="text-base font-semibold text-green-800 dark:text-green-200 mb-4 tracking-wide text-center">🚘 Checked-out cars</h2>
            <h3 className="text-4xl font-extrabold text-green-700 dark:text-green-400">{checkoutCountInMay ?? "Loading..."}</h3>
            <span className="text-lg font-semibold text-green-700 dark:text-green-300 mt-1">Cars</span>
          </div>

          {/* Car in location */}
          <div className="flex-1 min-w-[180px] max-w-[22%] flex flex-col items-center bg-yellow-50 dark:bg-yellow-900 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
            <h2 className="text-base font-semibold text-yellow-800 dark:text-yellow-200 mb-4 tracking-wide text-center">🅿️ Cars in Lot</h2>
            <h3 className="text-4xl font-extrabold text-yellow-700 dark:text-yellow-400">{checkinCount != null ? Math.max(checkinCount - (checkoutCountInMay ?? 0), 0) : "Loading..."}</h3>
            <span className="text-lg font-semibold text-yellow-700 dark:text-yellow-300 mt-1">Cars</span>
          </div>

          {/* Extend Booking */}
          <div className="flex-1 min-w-[180px] max-w-[22%] flex flex-col items-center bg-green-50 dark:bg-green-900 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
            <h2 className="text-base font-semibold text-green-800 dark:text-green-200 mb-4 tracking-wide text-center">💳 Extend Booking</h2>
            <h3 className="text-4xl font-extrabold text-green-700 dark:text-green-400">{extendBookingPaymentCount ?? "Loading..."}</h3>
            <span className="text-lg font-semibold text-green-700 dark:text-green-300 mt-1">Requests</span>
          </div>

          {/* Change time */}
          <div className="flex-1 min-w-[180px] max-w-[22%] flex flex-col items-center bg-green-50 dark:bg-green-900 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
            <h2 className="text-base font-semibold text-green-800 dark:text-green-200 mb-4 tracking-wide text-center">⏰ Change time</h2>
            <h3 className="text-4xl font-extrabold text-green-700 dark:text-green-400">{changeTimePaymentCount ?? "Loading..."}</h3>
            <span className="text-lg font-semibold text-green-700 dark:text-green-300 mt-1">Requests</span>
          </div>
        </div>
      </div>

      <div className="flex gap-6 mt-6">
        <div className="flex-[0.6]">
          <UpcomingEco />
        </div>

        <div className="flex-[0.4] bg-white rounded-2xl shadow-md p-6 flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Fine amount $</h2>
          {loadingRevenue ? (
            <p className="text-gray-500 italic">Loading...</p>
          ) : totalRevenue !== null ? (
            <p className="text-3xl font-bold text-green-600 tracking-wide">
              {totalRevenue.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
            </p>
          ) : (
            <p className="text-red-500">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
