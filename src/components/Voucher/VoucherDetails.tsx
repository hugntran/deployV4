import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Tag, CalendarDays, Gift } from "lucide-react";

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

const statusColorMap: Record<string, string> = {
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  EXPIRED: "bg-gray-100 text-gray-700",
  UP_COMING: "bg-yellow-100 text-yellow-700",
};

const VoucherDetails: React.FC = () => {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const voucher = state as Voucher;

  if (!voucher) {
    return <p className="p-4 text-red-500">No voucher data found for ID: {id}</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 mt-8 bg-gradient-to-br from-white to-gray-50 shadow-2xl rounded-2xl border border-gray-200">
      <button onClick={() => navigate("/voucher-management-list")} className="flex items-center text-sm text-blue-600 hover:underline mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </button>

      <div className="flex flex-col sm:flex-row gap-6">
        <img
          src={voucher.thumbnailUrl || "/images/country/intro-to-simpsons.jpg"}
          alt={voucher.title}
          className="w-48 h-48 object-cover rounded-xl border shadow-sm"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/images/country/intro-to-simpsons.jpg";
          }}
        />
        <div className="flex-1 space-y-2">
          <h2 className="text-3xl font-bold text-gray-800">{voucher.title}</h2>

          <span className={`inline-block px-3 py-1 text-sm rounded-full font-medium ${statusColorMap[voucher.status] || "bg-gray-100 text-gray-700"}`}>{voucher.status}</span>

          <p className="text-gray-600 mt-2">{voucher.description}</p>
        </div>
      </div>

      <hr className="my-6 border-gray-300" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-gray-800">
        <DetailItem label="ID" value={voucher.id.slice(0, 8).toUpperCase()} />
        <DetailItem label="Code" value={voucher.code.toUpperCase()} icon={<Tag size={16} />} />
        <DetailItem label="Valid From" value={new Date(voucher.validFrom).toLocaleString()} icon={<CalendarDays size={16} />} />
        <DetailItem label="Valid Until" value={new Date(voucher.validUntil).toLocaleString()} icon={<CalendarDays size={16} />} />
        <DetailItem label="Minimum Spend" value={`${voucher.minimumSpentAmount.toLocaleString()} USD`} />
        <DetailItem label="Discount" value={`${voucher.discountAmount} ${voucher.percentage ? "%" : "USD"}`} icon={<Gift size={16} />} />
        <DetailItem label="Total Usage Limit" value={voucher.totalUsageLimit.toString()} />
        <DetailItem label="Max Usage/User" value={voucher.maxUsagePerUser.toString()} />
        <DetailItem label="Total Used" value={voucher.totalUsed.toString()} />
        <DetailItem label="Discount Type" value={voucher.percentage ? "Percentage" : "Fixed Amount"} />
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
  <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-sm">
    {icon && <div className="text-gray-500 mt-0.5">{icon}</div>}
    <div>
      <div className="text-xs text-gray-500 font-semibold uppercase">{label}</div>
      <div className="text-sm text-gray-800 font-medium">{value}</div>
    </div>
  </div>
);

export default VoucherDetails;
