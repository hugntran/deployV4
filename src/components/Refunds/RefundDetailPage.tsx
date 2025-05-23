import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface Refund {
  id: string;
  bookingId: string;
  ticketIds: string[];
  userId: string;
  userName: string | null;
  email: string;
  description: string;
  amount: number;
  status: string;
  createdAt: string;
}

const RefundDetailPage: React.FC = () => {
  const location = useLocation();
  const refund: Refund = location.state;
  const navigate = useNavigate();

  if (!refund) {
    return <p>Error: Refund not found</p>;
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">Refund Detail</h1>

        {/* Card-style information display */}
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
            <strong className="text-gray-700">Id:</strong>
            <p className="text-gray-600">{refund.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
            <strong className="text-gray-700">Booking ID:</strong>
            <p className="text-gray-600">{refund.bookingId.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
            <strong className="text-gray-700">Ticket ID:</strong>
            <p className="text-gray-600">{refund.ticketIds.map((ticketId) => ticketId.slice(0, 8).toUpperCase()).join(", ")}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
            <strong className="text-gray-700">Customer:</strong>
            <p className="text-gray-600">{refund.userName ?? "N/A"}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
            <strong className="text-gray-700">Email:</strong>
            <p className="text-gray-600">{refund.email}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
            <strong className="text-gray-700">Description:</strong>
            <p className="text-gray-600">{refund.description}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
            <strong className="text-gray-700">Amount:</strong>
            <p className="text-gray-600">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(refund.amount)}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
            <strong className="text-gray-700">Transaction Time:</strong>
            <p className="text-gray-600">{new Date(refund.createdAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Back button */}
        <div className="mt-6 text-center">
          <button onClick={() => navigate("/refund-list")} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200">
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefundDetailPage;
