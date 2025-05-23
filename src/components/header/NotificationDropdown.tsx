import { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useNotificationSocket } from "../services/useNotificationSocket";
import { API_BASE_URL } from "../../config";

interface NotificationContentData {
  locationId?: string;
  slotNumber?: string | number;
  ticketId?: string;
}

interface Notification {
  id: string;
  title: string;
  content: string;
  contentData?: NotificationContentData;
  type: string;
  createdAt: string;
}

interface NotificationWithTime extends Notification {
  savedAt: number;
}

function getStoredNotifications(): NotificationWithTime[] {
  try {
    const stored = localStorage.getItem("notifications");
    if (!stored) return [];
    const parsed: NotificationWithTime[] = JSON.parse(stored);
    const now = Date.now();
    return parsed.filter((n) => now - n.savedAt < 10 * 60 * 1000);
  } catch {
    return [];
  }
}

function saveNotifications(notifications: NotificationWithTime[]) {
  try {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  } catch {
    // ignore storage errors
  }
}

async function fetchAllLocationsNearby() {
  const allLocations: { id: string; name: string }[] = [];
  let page = 0;
  const size = 100;
  let totalPages = 1;

  const baseURL = `${API_BASE_URL}/app-data-service/locations/nearby?longitude=105.779303&latitude=21.028759&maxDistance=100`;

  const token = localStorage.getItem("authToken");

  while (page < totalPages) {
    const res = await fetch(`${baseURL}&page=${page}&size=${size}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error("Failed to fetch locations, status:", res.status);
      break;
    }
    const data = await res.json();
    console.log("API response data:", data);

    if (!data.content || !Array.isArray(data.content)) {
      console.error("API response missing content array");
      break;
    }

    const locations = data.content.map((loc: any) => ({
      id: loc.id,
      name: loc.name,
    }));

    allLocations.push(...locations);
    totalPages = data.totalPages;
    page += 1;
  }

  return allLocations;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notifications, setNotifications] = useState<NotificationWithTime[]>(() => getStoredNotifications());
  const [showAll, setShowAll] = useState(false);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);

  const toggleDropdown = () => setIsOpen((open) => !open);
  const closeDropdown = () => setIsOpen(false);

  const handleClick = () => {
    toggleDropdown();
    setNotifying(false);
  };

  useNotificationSocket((notification) => {
    const now = Date.now();
    const newNotification: NotificationWithTime = { ...notification, savedAt: now };

    setNotifications((prev) => {
      const filteredPrev = prev.filter((n) => now - n.savedAt < 10 * 60 * 1000);
      const updated = [newNotification, ...filteredPrev].slice(0, 20);
      saveNotifications(updated);
      return updated;
    });
    setNotifying(true);
  });

  useEffect(() => {
    async function loadLocations() {
      try {
        const locs = await fetchAllLocationsNearby();
        setLocations(locs);
      } catch (err) {
        console.error("Failed to fetch locations", err);
      }
    }
    loadLocations();
  }, []);

  console.log("Locations:", locations);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setNotifications((prev) => {
        const filtered = prev.filter((n) => now - n.savedAt < 10 * 60 * 1000);
        saveNotifications(filtered);
        return filtered;
      });
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const visibleNotifications = showAll ? notifications : notifications.slice(0, 5);

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        <span className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${!notifying ? "hidden" : "flex"}`}>
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px]"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Notification</h5>
          <button onClick={toggleDropdown} className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            ✕
          </button>
        </div>
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {visibleNotifications.length === 0 ? (
            <li className="text-center text-sm text-gray-500 dark:text-gray-400">No notifications</li>
          ) : (
            visibleNotifications.map((item) => {
              const locationName = locations.find((loc) => loc.id === item.contentData?.locationId)?.name;

              return (
                <li key={item.id}>
                  <DropdownItem onItemClick={closeDropdown} className="flex flex-col gap-1 rounded-lg border-b border-gray-100 p-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 flex flex-wrap gap-x-2 gap-y-1 items-center">
                      {item.contentData?.locationId && <span>📍 Location: {locationName || item.contentData.locationId}</span>}
                      {item.contentData?.slotNumber !== undefined && <span>🔢 Slot: {item.contentData.slotNumber}</span>}
                      {item.contentData?.ticketId && <span>🎟 Ticket: {item.contentData.ticketId.slice(0, 8).toUpperCase()}</span>}
                    </span>
                  </DropdownItem>
                </li>
              );
            })
          )}
        </ul>
        {notifications.length > 5 && (
          <button className="mt-3 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400" onClick={() => setShowAll((s) => !s)}>
            {showAll ? "Show less" : "Show all"}
          </button>
        )}
      </Dropdown>
    </div>
  );
}
