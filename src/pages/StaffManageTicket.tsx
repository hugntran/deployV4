import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import TicketList from "../components/StaffTicket/TicketList";
import { Box } from "@mui/material";

export default function ManageTicket() {
  return (
    <>
      <PageMeta title="Ticket" description={""} />
      <PageBreadcrumb pageTitle="🎟️ Ticket" />
      <Box className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4 lg:p-6">
        <TicketList />
      </Box>
    </>
  );
}
