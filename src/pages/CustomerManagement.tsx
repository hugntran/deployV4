import { useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import CustomerManagementList from "../components/Customer/CustomerManagementList";
import SearchBar from "../components/ContentTop/SearchBar";

export default function CustomerManagement() {
  const [searchText, setSearchText] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  return (
    <>
      <PageMeta title="Customer" description="" />
      <PageBreadcrumb pageTitle="👤 Customer" />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4 lg:p-6">
        <div className="flex flex-col gap-6">
          {/* Top filter bar */}
          <div className="flex flex-col md:flex-row md:flex-wrap md:items-center md:justify-between gap-4 bg-gray-50 p-3 rounded-lg shadow-sm">
            <SearchBar value={searchText} onChange={setSearchText} placeholder="🔍 Find by name, mail/ phone" />

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
            </div>
          </div>

          {/* Main content */}
          <div className="rounded-lg shadow-md bg-gray-50">
            <CustomerManagementList searchText={searchText} statusFilter={statusFilter} />
          </div>
        </div>
      </div>
    </>
  );
}
