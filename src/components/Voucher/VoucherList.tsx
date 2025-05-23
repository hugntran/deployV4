import React, { useState, useEffect } from "react";
import classNames from "classnames";
import { useNavigate } from "react-router-dom";
import Pagination from "../ContentBottom/Pagination";
import { API_BASE_URL } from "../../config";

interface Voucher {
  id: string;
  description: string;
  status: string;
  code: string;
  validFrom: string;
  validUntil: string;
  totalUsageLimit: number;
  title: string;
  minimumSpentAmount: number;
  maxUsagePerUser: number;
  totalUsed: number;
  percentage: boolean;
  discountAmount: number;
  thumbnailUrl: string;
}

interface VoucherListProps {
  searchTerm: string;
  statusFilter: string;
}

const statusColorMap: Record<string, string> = {
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  EXPIRED: "bg-gray-100 text-gray-700",
  UP_COMING: "bg-yellow-100 text-yellow-700",
};

const statusPriority: Record<string, number> = {
  IN_PROGRESS: 1,
  UP_COMING: 2,
  EXPIRED: 3,
};

const ITEMS_PER_PAGE = 20;

const VoucherList: React.FC<VoucherListProps> = ({ searchTerm, statusFilter }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchAllVouchers = async () => {
      try {
        let allData: Voucher[] = [];
        let page = 0;
        let hasMore = true;

        const token = localStorage.getItem("authToken");

        while (hasMore) {
          const response = await fetch(`${API_BASE_URL}/payment/vouchers/admin/all-vouchers?page=${page}&size=100`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) throw new Error("Failed to fetch vouchers");

          const result = await response.json();
          const content = result.content || [];
          allData = [...allData, ...content];
          hasMore = content.length === 100;
          page++;
        }

        if (!isCancelled) {
          setVouchers(allData);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || "Failed to fetch vouchers");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchAllVouchers();

    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredVouchers = vouchers
    .filter(
      (voucher) =>
        (statusFilter === "ALL" || voucher.status === statusFilter) && (voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) || voucher.title.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      return (statusPriority[a.status] || 0) - (statusPriority[b.status] || 0);
    });

  const totalPages = Math.ceil(filteredVouchers.length / ITEMS_PER_PAGE);
  const paginatedVouchers = filteredVouchers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="overflow-x-auto p-4">
      {loading && <p>Loading vouchers...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      {!loading && filteredVouchers.length === 0 && <p className="text-gray-500">No vouchers found.</p>}

      {!loading && filteredVouchers.length > 0 && (
        <>
          <table className="min-w-full bg-white border border-gray-200 shadow rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-gray-100 text-sm text-gray-700 text-left">
                <th className="px-4 py-3 border-b">No</th>
                <th className="px-4 py-3 border-b">Code</th>
                <th className="px-4 py-3 border-b">Title</th>
                <th className="px-4 py-3 border-b">Valid From</th>
                <th className="px-4 py-3 border-b">Valid Until</th>
                <th className="px-4 py-3 border-b">Status</th>
                <th className="px-4 py-3 border-b">Details</th>
              </tr>
            </thead>
            <tbody>
              {paginatedVouchers.map((v, index) => (
                <tr key={v.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-2 border-b">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                  <td className="px-4 py-2 border-b uppercase">{v.code.slice(0, 10)}</td>
                  <td className="px-4 py-2 border-b">{v.title}</td>
                  <td className="px-4 py-2 border-b">{new Date(v.validFrom).toLocaleString()}</td>
                  <td className="px-4 py-2 border-b">{new Date(v.validUntil).toLocaleString()}</td>
                  <td className="px-4 py-2 border-b">
                    <span className={classNames("px-2 py-1 text-xs font-semibold rounded-full", statusColorMap[v.status] || "bg-gray-100 text-gray-700")}>
                      {v.status
                        .split("_")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(" ")}
                    </span>
                  </td>
                  <td className="px-4 py-2 border-b">
                    <button onClick={() => navigate(`/vouchers/${v.id}`, { state: v })} className="text-sm text-blue-600 hover:underline font-medium">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
};

export default VoucherList;
