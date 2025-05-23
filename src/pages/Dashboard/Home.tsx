import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Ecommerce from "../../components/ecommerce/Ecommerce";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";

export default function Home() {
  const userRole = localStorage.getItem("userRole");

  if (userRole === "ADMIN") {
    return (
      <>
        <PageMeta title="Dashboard" description="" />
        <PageBreadcrumb pageTitle="📊 Dashboard" />

        <div className="min-h-screen p-6 bg-gray-50">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <EcommerceMetrics />
          </div>
        </div>
      </>
    );
  }

  if (userRole === "STAFF") {
    return (
      <>
        <PageMeta title="Dashboard" description="" />
        <PageBreadcrumb pageTitle="📊 Dashboard" />
        <div className="min-h-screen p-6 bg-gray-100">
          <Ecommerce />
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Access Denied" description="" />
      <div className="min-h-screen flex items-center justify-center text-center text-red-600 font-semibold text-lg">You do not have the required role to view this page.</div>
    </>
  );
}
