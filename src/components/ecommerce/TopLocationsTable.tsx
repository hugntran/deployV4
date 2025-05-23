import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config";

interface LocationRevenue {
  locationId: string | null;
  locationName: string | null;
  totalRevenue: number;
  invoiceCount: number;
}

interface Props {
  fromDate: string | undefined;
  toDate: string | undefined;
}

export default function TopLocationsTable({ fromDate, toDate }: Props) {
  const [data, setData] = useState<LocationRevenue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fromDate || !toDate) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("No auth token");
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        params.append("fromDate", fromDate);
        params.append("toDate", toDate);

        const response = await fetch(`${API_BASE_URL}/app-data-service/api/invoices/top-locations?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Error fetching data: ${response.statusText}`);
        }

        const jsonData: LocationRevenue[] = await response.json();
        setData(jsonData);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fromDate, toDate]);

  if (loading) return <p>Loading top locations...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (data.length === 0) return <p>No data available</p>;

  return (
    <div className="overflow-x-auto w-full max-w-screen-md mx-auto">
      <table className="w-full table-fixed border-collapse border border-gray-300 dark:border-gray-700 text-sm" style={{ minWidth: "400px" }}>
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="border px-2 md:px-4 py-1 md:py-3 text-left w-[60%]">Location</th>
            <th className="border px-2 md:px-4 py-1 md:py-3 text-right w-[20%]">Revenue</th>
            <th className="border px-2 md:px-4 py-1 md:py-3 text-right w-[20%]">Invoice</th>
          </tr>
        </thead>
        <tbody>
          {data
            .filter(({ locationId, locationName }) => locationId !== null && locationName !== null)
            .map(({ locationId, locationName, totalRevenue, invoiceCount }, idx) => (
              <tr key={locationId ?? idx} className="even:bg-gray-50 dark:even:bg-gray-900 min-h-[30px] md:min-h-[50px]">
                <td className="border px-2 md:px-4 py-1 md:py-3 truncate">{locationName}</td>
                <td className="border px-2 md:px-4 py-1 md:py-3 text-right">{totalRevenue.toFixed(2)}</td>
                <td className="border px-2 md:px-4 py-1 md:py-3 text-right">{invoiceCount}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
