import { useState, useEffect } from "react";
import { Container, Paper, Tabs, Tab, Stack, Badge } from "@mui/material";
import CheckinTab from "./TikTab/CheckinTab.tsx";
import UpComingTab from "./TikTab/UpComingTab.tsx";
import OverdueTab from "./TikTab/OverdueTab";
import CheckoutTab from "./TikTab/CheckoutTab";
import { useFetchData } from "../../hooks/useFetchData";
import { useTicketGroups } from "../../hooks/useTicketGroups.ts";
import OnServiceTab from "./TikTab/OnService.tsx";
import { fetchWithAuth } from "../../api/fetchWithAuth.ts";
import ExtendTab from "./TikTab/ExtendTab";
import ChangeTimeTab from "./TikTab/ChangeTimeTab.tsx";
import SearchBar from "../ContentTop/SearchBar.tsx";
import { API_BASE_URL } from "../../config.ts";

function TicketList() {
  const [tab, setTab] = useState(0);
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [checkinRefreshKey, setCheckinRefreshKey] = useState(0);
  const [checkoutRefreshKey, setCheckoutRefreshKey] = useState(0);
  const [verifyRefreshKey, setVerifyRefreshKey] = useState(0);
  const [verifyRequiredTickets, setVerifyRequiredTickets] = useState<any[]>([]);
  const [changeTimeTickets, setChangeTimeTickets] = useState<any[]>([]);
  const [changeTimeRefreshKey, setChangeTimeRefreshKey] = useState(0);
  const locationId = localStorage.getItem("locationId") || "";

  useEffect(() => {
    const fetchAllTickets = async () => {
      if (!locationId) return;

      try {
        const pageSize = 100;
        let page = 0;
        let allTickets: any[] = [];
        let totalElements = 0;

        do {
          const response = await fetchWithAuth<{
            content: any[];
            totalElements: number;
          }>(`${API_BASE_URL}/app-data-service/tickets/pageable/find?locationId=${locationId}&page=${page}&size=${pageSize}`);

          allTickets = [...allTickets, ...response.content];
          totalElements = response.totalElements;
          page++;
        } while (allTickets.length < totalElements);

        setAllTickets(allTickets);
      } catch (err) {
        console.error("Error fetching all tickets:", err);
      }
    };

    fetchAllTickets();
  }, [locationId]);

  const tickets = allTickets
    .filter((item) => item.ticket.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) || item.slotNumber?.toLowerCase().includes(searchTerm.toLowerCase()))
    .map((item) => item.ticket);

  const { data: checkoutTickets = [] } = useFetchData<any>({
    url: `${API_BASE_URL}/app-data-service/tickets/checkout-requests?page=0&size=100`,
    filterFn: (list) => list.filter((t: any) => (t.slot?.locationId === locationId || t.ticket?.locationId === locationId) && t.ticket?.isCheckOut !== true),
    trigger: `${locationId}-${checkoutRefreshKey}`,
  });

  const { data: CheckinTickets = [] } = useFetchData<any>({
    url: `${API_BASE_URL}/app-data-service/tickets/checkin-requests?page=0&size=100`,
    filterFn: (list) => list.filter((t: any) => (t.slot?.locationId === locationId || t.ticket?.locationId === locationId) && t.ticket?.isCheckIn !== true),
    trigger: `${locationId}-${checkinRefreshKey}`,
  });

  useEffect(() => {
    const fetchVerifyRequired = async () => {
      if (locationId) {
        try {
          const res = await fetchWithAuth(`${API_BASE_URL}/app-data-service/tickets/verify-required?locationId=${locationId}&page=0&size=100`);
          const filtered = (res.content || []).filter((item: any) => item.parent?.ticket?.locationId === locationId);
          setVerifyRequiredTickets(filtered);
        } catch (err) {
          console.error("Error fetching verify-required tickets:", err);
        }
      }
    };

    fetchVerifyRequired();
  }, [locationId, verifyRefreshKey]);

  useEffect(() => {
    const fetchChangeTimeTickets = async () => {
      if (locationId) {
        try {
          const res = await fetchWithAuth(`${API_BASE_URL}/app-data-service/tickets/verify-required-change-time?page=0&size=100&sort=startDateTime,desc`);
          const filtered = (res.content || []).filter((item: any) => item.ticket.locationId === locationId);
          setChangeTimeTickets(filtered);
        } catch (err) {
          console.error("Error fetching change-time tickets:", err);
        }
      }
    };

    fetchChangeTimeTickets();
  }, [locationId, changeTimeRefreshKey]);

  const { upComing, overdue, onService } = useTicketGroups(tickets);

  const isLoading = !allTickets.length;

  const tabs = [
    {
      label: "Up Coming",
      component: <UpComingTab tickets={upComing} locationId={locationId} />,
      count: upComing.length,
    },
    {
      label: "Check in",
      component: (
        <CheckinTab
          tickets={CheckinTickets.filter((t) => t.ticket?.id?.toLowerCase().includes(searchTerm.toLowerCase()) || t.slot?.slotNumber?.toLowerCase().includes(searchTerm.toLowerCase()))}
          onRefresh={() => {
            setCheckinRefreshKey((prev) => prev + 1);
          }}
        />
      ),
      count: CheckinTickets.filter((t) => t.ticket?.id?.toLowerCase().includes(searchTerm.toLowerCase()) || t.slot?.slotNumber?.toLowerCase().includes(searchTerm.toLowerCase())).length,
    },
    {
      label: "On Service",
      component: <OnServiceTab tickets={onService} locationId={locationId} />,
      count: onService.length,
    },
    {
      label: "Extend",
      component: (
        <ExtendTab
          tickets={verifyRequiredTickets.filter(
            (t) => t.parent?.ticket?.id?.toLowerCase().includes(searchTerm.toLowerCase()) || t.parent?.slotNumber?.toLowerCase().includes(searchTerm.toLowerCase())
          )}
          onReassignSuccess={() => setVerifyRefreshKey((prev) => prev + 1)}
        />
      ),
      count: verifyRequiredTickets.filter((t) => t.parent?.ticket?.id?.toLowerCase().includes(searchTerm.toLowerCase()) || t.parent?.slotNumber?.toLowerCase().includes(searchTerm.toLowerCase()))
        .length,
    },
    {
      label: "Change Time",
      component: (
        <ChangeTimeTab
          tickets={changeTimeTickets.filter((t) => t.ticket?.id?.toLowerCase().includes(searchTerm.toLowerCase()) || t.slotNumber?.toLowerCase().includes(searchTerm.toLowerCase()))}
          locationId={locationId}
          isLoading={isLoading}
          onReassignSuccess={() => setChangeTimeRefreshKey((prev) => prev + 1)}
        />
      ),
      count: changeTimeTickets.filter((t) => t.ticket?.id?.toLowerCase().includes(searchTerm.toLowerCase()) || t.slotNumber?.toLowerCase().includes(searchTerm.toLowerCase())).length,
    },
    {
      label: "Overdue",
      component: <OverdueTab tickets={overdue} locationId={locationId} />,
      count: overdue.length,
    },
    {
      label: "Check out",
      component: (
        <CheckoutTab
          tickets={checkoutTickets.filter((t) => t.ticket?.id?.toLowerCase().includes(searchTerm.toLowerCase()) || t.slot?.slotNumber?.toLowerCase().includes(searchTerm.toLowerCase()))}
          onRefresh={() => {
            setCheckoutRefreshKey((prev) => prev + 1);
          }}
        />
      ),
      count: checkoutTickets.filter((t) => t.ticket?.id?.toLowerCase().includes(searchTerm.toLowerCase()) || t.slot?.slotNumber?.toLowerCase().includes(searchTerm.toLowerCase())).length,
    },
  ];

  return (
    <Container maxWidth="lg">
      <Paper
        sx={{
          width: "100%",
          overflow: "hidden",
          borderRadius: 2,
          boxShadow: 2,
          p: 2,
        }}
      >
        <Stack spacing={2}>
          {!isLoading && locationId && (
            <>
              <SearchBar value={searchTerm} onChange={(val) => setSearchTerm(val)} placeholder="Search by ticket id/ Lot number" />

              <Tabs value={tab} onChange={(_, newTab) => setTab(newTab)} aria-label="Ticket tabs" variant="scrollable" scrollButtons="auto" textColor="primary" indicatorColor="primary">
                {tabs.map((tabItem, idx) => (
                  <Tab
                    key={idx}
                    label={
                      <Badge color="error" badgeContent={tabItem.count} max={99}>
                        {tabItem.label}
                      </Badge>
                    }
                  />
                ))}
              </Tabs>

              {tabs[tab]?.component}
            </>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}

export default TicketList;
