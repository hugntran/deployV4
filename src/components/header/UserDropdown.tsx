import { useState, useEffect, useMemo, useCallback } from "react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useNavigate } from "react-router";
import { API_BASE_URL } from "../../config";

// Custom hook lấy userId từ token
function useUserIdFromToken() {
  return useMemo(() => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return null;

      const payloadBase64 = token.split(".")[1];
      const decodedPayload = JSON.parse(atob(payloadBase64));
      return decodedPayload?.userId || null;
    } catch {
      return null;
    }
  }, []);
}

// Custom hook fetch user info
function useUserInfo(userId: string | null) {
  const [username, setUsername] = useState("Kakarot");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);

    async function fetchUser() {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${API_BASE_URL}/identity/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Fetch user failed");
        const data = await res.json();
        setUsername(data?.result?.username ?? "Kakarot");
        setAvatarUrl(data?.result?.avatarUrl ?? null);
      } catch {
        setUsername("Kakarot");
        setAvatarUrl(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  return { username, avatarUrl, loading };
}

// SVG component cho mũi tên dropdown
const DropdownArrow = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
    width="18"
    height="20"
    viewBox="0 0 18 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M4.3125 8.65625L9 13.3437L13.6875 8.65625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const userId = useUserIdFromToken();
  const { username, avatarUrl, loading } = useUserInfo(userId);

  // Xử lý toggle dropdown (dùng useCallback để tránh render lại)
  const toggleDropdown = useCallback(() => setIsOpen((prev) => !prev), []);
  const closeDropdown = useCallback(() => setIsOpen(false), []);

  const handleSignOut = useCallback(() => {
    localStorage.removeItem("authToken");
    navigate("/");
  }, [navigate]);

  // Xử lý lỗi ảnh (nếu load avatar lỗi thì hiện ảnh mặc định)
  const onAvatarError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    target.onerror = null; // prevent infinite loop
    target.src = "/images/country/handsome-squidward-42402-400x250.jpg";
  };

  return (
    <div className="relative">
      <button onClick={toggleDropdown} className="flex items-center text-gray-700 dark:text-gray-400 dropdown-toggle" aria-haspopup="true" aria-expanded={isOpen}>
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          {loading ? (
            <div className="animate-pulse bg-gray-300 rounded-full h-11 w-11" />
          ) : (
            <img src={avatarUrl || "/images/country/handsome-squidward-42402-400x250.jpg"} alt="User avatar" className="object-cover w-full h-full" onError={onAvatarError} loading="lazy" />
          )}
        </span>
        <span className="block mr-1 font-medium text-theme-sm select-none">{loading ? "Loading..." : username.split("@")[0]}</span>
        <DropdownArrow isOpen={isOpen} />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] w-[260px] flex flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to={userId ? `/user-details/${userId}` : "#"}
              className="flex items-center gap-3 px-3 py-2 font-medium rounded-lg text-theme-sm text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              {/* Icon Profile */}
              <svg
                className="fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path fillRule="evenodd" clipRule="evenodd" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM12 14c-3.33 0-6 1.67-6 5v1h12v-1c0-3.33-2.67-5-6-5z" fill="currentColor" />
              </svg>
              Profile
            </DropdownItem>
          </li>
        </ul>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 mt-3 font-medium rounded-lg text-theme-sm text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 w-full text-left"
        >
          {/* Icon Sign out */}
          <svg
            className="fill-gray-500 group-hover:fill-gray-700 dark:group-hover:fill-gray-300"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path fillRule="evenodd" clipRule="evenodd" d="M16 13v-2H7v-3l-5 4 5 4v-3h9zM20 19v-14h-8v2h6v10h-6v2h8z" fill="currentColor" />
          </svg>
          Sign out
        </button>
      </Dropdown>
    </div>
  );
}
