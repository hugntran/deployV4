import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Props {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onQuickSelect: (type: string) => void;
}

const DateRangeFilter: React.FC<Props> = ({ startDate, endDate, onStartDateChange, onEndDateChange, onQuickSelect }) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Date pickers */}
      <div className="flex gap-2">
        <DatePicker
          selected={startDate}
          onChange={onStartDateChange}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          placeholderText="Start date"
          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-[140px]"
        />
        <DatePicker
          selected={endDate}
          onChange={onEndDateChange}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          placeholderText="End date"
          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-[140px]"
        />
      </div>

      {/* Quick select dropdown */}
      <select onChange={(e) => onQuickSelect(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm bg-white">
        <option value="">Quick Select</option>
        <option value="today">Today</option>
        <option value="thisWeek">This Week</option>
        <option value="thisMonth">This Month</option>
        <option value="thisYear">This Year</option>
      </select>

      {/* Clear button */}
      <button
        onClick={() => {
          onStartDateChange(null);
          onEndDateChange(null);
        }}
        className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded"
      >
        Clear
      </button>
    </div>
  );
};

export default DateRangeFilter;
