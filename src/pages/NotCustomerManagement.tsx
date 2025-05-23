import { useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import NotCustomerManagementList from "../components/Customer/NotCustomerManagementList";
import SearchBar from "../components/ContentTop/SearchBar";
import { useNavigate } from "react-router-dom";

export default function NotCustomerManagement() {
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const navigate = useNavigate();

  return (
    <>
      <PageMeta title="Staff" description="" />
      <PageBreadcrumb pageTitle="🧑‍💼 Staff" />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4 lg:p-6">
        <div className="flex flex-col gap-6">
          {/* Top filter bar */}
          <div className="flex flex-col md:flex-row md:flex-wrap md:items-center md:justify-between gap-4 bg-gray-50 p-3 rounded-lg shadow-sm">
            <SearchBar value={searchText} onChange={setSearchText} placeholder="🔍 Search by name" />

            <div className="flex justify-end gap-4">
              {/* Status filter dropdown */}
              <div className="flex items-center gap-2 text-sm">
                <label htmlFor="statusFilter" className="whitespace-nowrap font-medium text-gray-700">
                  Filter by status:
                </label>
                <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-2 border rounded-lg">
                  <option value="">All</option>
                  <option value="Verified">Verified</option>
                  <option value="Unverified">Unverified</option>
                </select>
              </div>

              <button onClick={() => navigate("/create-user")} className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition text-sm">
                Add New Staff
              </button>
            </div>
          </div>

          {/* Main content */}
          <div className="rounded-lg shadow-md bg-gray-50">
            <NotCustomerManagementList searchText={searchText} statusFilter={statusFilter} />
          </div>
        </div>
      </div>
    </>
  );
}
