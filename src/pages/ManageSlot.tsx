import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import SlotListPage from "../components/Slot/SlotListPage";

export default function ManageSlot() {
  return (
    <>
      <PageMeta title="Lot" description="" />
      <PageBreadcrumb pageTitle="🚗 Lot" />
      <div className="rounded-2xl border border-gray-200 bg-white p-4 lg:p-6">
        <div className="flex flex-col md:flex-row md:flex-wrap md:items-center md:justify-between gap-4 bg-gray-50 p-3 rounded-lg shadow-sm"></div>
        <div className="rounded-lg shadow-md bg-gray-50">
          <SlotListPage />
        </div>
      </div>
    </>
  );
}
