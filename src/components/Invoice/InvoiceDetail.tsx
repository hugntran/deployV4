import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  locationName?: string;
}

const formatUSD = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const InvoiceDetail = () => {
  const { state } = useLocation();
  const navigate = useNavigate(); // Hook for navigation
  const invoice: Invoice | undefined = state?.invoice;

  // State to store user details
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (invoice?.userId) {
      // Get the token from localStorage
      const token = localStorage.getItem("authToken");

      if (!token) {
        console.error("No token found");
        return;
      }

      // Fetch user data from the API with token for authentication
      fetch(`${API_BASE_URL}/identity/users/${invoice.userId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.code === 1000) {
            setUserDetails(data.result); // Set the user data
          }
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        })
        .finally(() => {
          setLoading(false); // Set loading to false after fetching
        });
    }
  }, [invoice?.userId]); // Run the effect when userId changes

  if (!invoice) {
    return <div className="p-6 text-red-500">No invoice data provided.</div>;
  }

  if (loading) {
    return <div className="p-6 text-gray-500">Loading user details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-xl border border-gray-200">
      <div>
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-2xl text-gray-800">Pogo Corporation</p>
            <p className="text-sm text-gray-500">1 Queen Street, London NW19EX</p>
            <p className="text-sm text-gray-500">+44 12 3456 7899</p>
          </div>
          <div className="text-right">
            <p className="text-lg text-gray-700">Invoice no: #{invoice.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-sm text-gray-500">Issued at: {new Date(invoice.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="border-t-2 border-gray-200 mt-8 pt-4">
          <p className="text-lg text-gray-800">Invoice to:</p>
          <p className="text-sm text-gray-600">{userDetails && userDetails.username ? userDetails.username.split("@")[0] : "Nguyễn Văn A"}</p>
          {userDetails && userDetails.username && userDetails.email && <p className="text-sm text-gray-600">{userDetails.email}</p>}
        </div>
      </div>

      <div className="overflow-x-auto mt-8">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-100 text-gray-600">
              <th className="px-6 py-3 text-left font-medium">Description</th>
              <th className="px-6 py-3 text-left font-medium">Quantity</th>
              <th className="px-6 py-3 text-left font-medium">Unit Price</th>
              <th className="px-6 py-3 text-left font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 border-b border-gray-200">{invoice.description}</td>
              <td className="px-6 py-4 border-b border-gray-200">{invoice.ticketsCount}</td>
              <td className="px-6 py-4 border-b border-gray-200 text-gray-700">{formatUSD(invoice.amount / invoice.ticketsCount)}</td>
              <td className="px-6 py-4 border-b border-gray-200 text-gray-700">{formatUSD(invoice.amount)}</td>
            </tr>
            <tr className="bg-gray-50 hover:bg-gray-100">
              <td className="px-6 py-4 border-b border-gray-200" colSpan={3}>
                <strong>Voucher Amount</strong>
              </td>
              <td className="px-6 py-4 border-b border-gray-200 text-green-600">{formatUSD(invoice.voucherAmount)}</td>
            </tr>
            <tr className="bg-gray-50 hover:bg-gray-100">
              <td className="px-6 py-4 border-b border-gray-200" colSpan={3}>
                <strong className="font-semibold">Total</strong>
              </td>
              <td className="px-6 py-4 border-b border-gray-200 text-blue-600 font-semibold">{formatUSD(invoice.finalAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          onClick={() => navigate("/invoice-list")} // Navigate back
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default InvoiceDetail;
