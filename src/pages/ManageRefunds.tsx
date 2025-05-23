import { useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import SearchBar from "../components/ContentTop/SearchBar";
import RefundListPage from "../components/Refunds/RefundListPage";
import DateRangeFilter from "../components/ContentTop/DateRangeFilter";
import "react-datepicker/dist/react-datepicker.css";

export default function ManageRefunds() {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleQuickSelect = (type: string) => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (type) {
      case "today":
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        break;

      case "thisWeek": {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(now.getFullYear(), now.getMonth(), diff);
        start.setHours(0, 0, 0, 0);

        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      }

      case "thisMonth":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);

        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;

      case "thisYear":
        start = new Date(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);

        end = new Date(now.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);
        break;

      default:
        return;
    }
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <>
      <PageMeta title="Refund" description="" />
      <PageBreadcrumb pageTitle="💵 Refund" />

      <div className="rounded-2xl border border-gray-300 bg-white p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-gray-50 p-5 rounded-xl shadow-inner border border-gray-200">
            <div className="w-full md:w-80">
              <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="🔍 Search by name, ID or description" />
            </div>

            <div className="w-full md:w-auto flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by time:</label>
              <DateRangeFilter startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} onQuickSelect={handleQuickSelect} />
            </div>
          </div>

          <div className="rounded-lg shadow-md bg-gray-50 p-4">
            <RefundListPage searchTerm={searchTerm} startDate={startDate} endDate={endDate} />
          </div>
        </div>
      </div>
    </>
  );
}
