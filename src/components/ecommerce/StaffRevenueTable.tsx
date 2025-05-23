import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";

interface StaffUser {
  id: string;
  username: string;
}

interface RevenueData {
  locationId: string;
  period: string;
  totalRevenue: number;
  locationName: string;
}

interface CombinedData {
  username: string;
  locationName: string;
  totalRevenue: number;
}

interface StaffRevenueTableProps {
  startDate: Date | null;
  endDate: Date | null;
}

export default function StaffRevenueTable({ startDate, endDate }: StaffRevenueTableProps) {
  const [data, setData] = useState<CombinedData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!startDate || !endDate) return;

      function formatDateLocal(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }

      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No auth token found.");
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch all users
        const userRes = await fetch(`${API_BASE_URL}/identity/users/get-users-admin?page=0&size=100`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userRes.ok) throw new Error("Failed to fetch users");
        const userJson = await userRes.json();

        // 2. Filter for STAFF users
        const staffUsers: StaffUser[] = userJson.result.content
          .filter((user: any) => user.roles.some((role: any) => role.name === "STAFF"))
          .map((user: any) => ({
            id: user.id,
            username: user.username,
          }));

        // 3. Fetch revenue per staff
        const allRevenues: CombinedData[] = [];

        const fromDate = formatDateLocal(startDate);
        const toDate = formatDateLocal(endDate);

        for (const staff of staffUsers) {
          const params = new URLSearchParams({
            groupType: "day",
            fromDate,
            toDate,
            staffId: staff.id,
          });

          const revenueRes = await fetch(`${API_BASE_URL}/app-data-service/api/invoices/revenue/grouped?${params.toString()}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (revenueRes.ok) {
            const revenueJson: RevenueData[] = await revenueRes.json();
            revenueJson.forEach((item) => {
              allRevenues.push({
                username: staff.username,
                locationName: item.locationName,
                totalRevenue: item.totalRevenue,
              });
            });
          }
        }

        setData(allRevenues);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  if (!startDate || !endDate) return <p>Please select a date range to view revenue data.</p>;
  if (loading) return <p>Loading staff revenue data...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="max-w-4xl mx-auto mt-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">💵 Revenue collected by staff</h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-700 text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="border px-4 py-2 text-left">Staff</th>
              <th className="border px-4 py-2 text-left">Location</th>
              <th className="border px-4 py-2 text-right">Total Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td className="border px-4 py-2 text-center italic text-gray-500" colSpan={3}>
                  <p>No data available for the selected period.</p>
                </td>
              </tr>
            ) : (
              Object.entries(
                data.reduce<Record<string, { locationName: string; totalRevenue: number }>>((acc, item) => {
                  const usernameNoGmail = item.username.replace(/@gmail\.com$/, "");
                  if (!acc[usernameNoGmail]) {
                    acc[usernameNoGmail] = { locationName: item.locationName || "All Locations", totalRevenue: 0 };
                  }
                  acc[usernameNoGmail].totalRevenue += item.totalRevenue;
                  return acc;
                }, {})
              ).map(([username, { locationName, totalRevenue }], idx) => (
                <tr key={idx} className="even:bg-gray-50 dark:even:bg-gray-900">
                  <td className="border px-4 py-2">{username}</td>
                  <td className="border px-4 py-2">{locationName}</td>
                  <td className="border px-4 py-2 text-right">$ {totalRevenue.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
