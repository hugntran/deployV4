import { useState, useEffect } from "react";
import { fetchWithAuth } from "../../api/fetchWithAuth";
import { useNavigate } from "react-router-dom";
import Pagination from "../ContentBottom/Pagination";
import { Tooltip } from "antd";
import { API_BASE_URL } from "../../config";

interface Invoice {
  id: string;
  locationId: string;
  userId: string;
  ticketsCount: number;
  description: string;
  type: string;
  amount: number;
  voucherAmount: number;
  finalAmount: number;
  createdAt: string;
}

interface Location {
  id: string;
  name: string;
}

const formatUSD = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

interface InvoicePageProps {
  searchQuery: string;
  locationFilter: string;
  typeFilter: string;
  fromDate: string;
  toDate: string;
}

const InvoicePage = ({ searchQuery, locationFilter, typeFilter, fromDate, toDate }: InvoicePageProps) => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [locationMap, setLocationMap] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);

  const pageSize = 20;

  const fetchLocationMap = async () => {
    try {
      const pageSize = 100;
      let allLocations: Location[] = [];
      let page = 0;
      let totalElements = 0;

      do {
        const response = await fetchWithAuth<{ content: Location[]; totalElements: number }>(
          `${API_BASE_URL}/app-data-service/locations/nearby?longitude=105.779303&latitude=21.028759&maxDistance=100&page=${page}&size=${pageSize}`
        );
        allLocations = [...allLocations, ...response.content];
        totalElements = response.totalElements;
        page++;
      } while (allLocations.length < totalElements);

      const map: Record<string, string> = {};
      allLocations.forEach((loc) => {
        map[loc.id] = loc.name;
      });

      setLocationMap(map);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const fetchInvoices = async (page: number) => {
    try {
      const params = new URLSearchParams();
      params.set("size", pageSize.toString());
      params.set("page", (page - 1).toString());
      params.set("sort", "createdAt,desc");

      if (locationFilter) params.set("locationId", locationFilter);
      if (typeFilter) params.set("searchText", typeFilter);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const response = await fetchWithAuth<{
        content: Invoice[];
        totalElements: number;
        totalPages: number;
      }>(`${API_BASE_URL}/app-data-service/api/invoices?${params.toString()}`);

      const filteredInvoices = response.content.filter((invoice) => invoice.id.toLowerCase().includes(searchQuery.toLowerCase())).filter((invoice) => !typeFilter || invoice.type === typeFilter);

      setInvoices(filteredInvoices);
      setTotalPages(response.totalPages);
      setTotalInvoices(response.totalElements);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const fetchTotalRevenue = async () => {
    if (!fromDate || !toDate) {
      setTotalRevenue(0);
      return;
    }

    try {
      const params = new URLSearchParams();
      params.set("groupType", "day");
      params.set("fromDate", fromDate);
      params.set("toDate", toDate);

      if (locationFilter) {
        params.set("locationId", locationFilter);
      }

      const response = await fetchWithAuth<
        {
          locationId: string;
          period: string;
          totalRevenue: number;
          locationName: string;
        }[]
      >(`${API_BASE_URL}/app-data-service/api/invoices/revenue/grouped?${params.toString()}`);

      const sumRevenue = response.reduce((sum, item) => sum + item.totalRevenue, 0);
      setTotalRevenue(sumRevenue);
    } catch (error) {
      console.error("Error fetching total revenue:", error);
      setTotalRevenue(0);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset page
  }, [searchQuery, locationFilter, typeFilter, fromDate, toDate]);

  useEffect(() => {
    fetchLocationMap();
    fetchInvoices(currentPage);
    fetchTotalRevenue();
  }, [currentPage, searchQuery, locationFilter, typeFilter, fromDate, toDate]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="pt-0 px-6 pb-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <div className="text-gray-600 text-sm">
          Total invoices: <span className="font-semibold">{totalInvoices}</span>
        </div>
        <Tooltip title="Total revenue calculated from all invoices within the selected date range and location.">
          <div className="text-gray-600 text-sm cursor-pointer">
            Total revenue: <span className="font-semibold">{formatUSD(totalRevenue)}</span>
          </div>
        </Tooltip>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-200 px-4 py-2">No</th>
              <th className="border border-gray-200 px-4 py-2">Invoice</th>
              <th className="border border-gray-200 px-4 py-2">Location</th>
              <th className="border border-gray-200 px-4 py-2">Total amount</th>
              <th className="border border-gray-200 px-4 py-2">Transaction type</th>
              <th className="border border-gray-200 px-4 py-2">Transaction time</th>
              <th className="border border-gray-200 px-4 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice, index) => (
              <tr key={invoice.id} className="text-center border border-gray-200">
                <td className="px-4 py-2">{(currentPage - 1) * pageSize + index + 1}</td>
                <td className="px-4 py-2">{invoice.id.slice(0, 8).toUpperCase()}</td>
                <td className="px-4 py-2">{locationMap[invoice.locationId] || invoice.locationId}</td>
                <td className="px-4 py-2">{formatUSD(invoice.finalAmount)}</td>
                <td className="px-4 py-2">
                  {invoice.type
                    .toLowerCase()
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </td>
                <td className="px-4 py-2">{new Date(invoice.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() =>
                      navigate(`/invoice-detail/${invoice.id}`, {
                        state: {
                          invoice: {
                            ...invoice,
                            locationName: locationMap[invoice.locationId] || invoice.locationId,
                          },
                        },
                      })
                    }
                    className="text-blue-500 hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
};

export default InvoicePage;
