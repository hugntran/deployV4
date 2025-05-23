import { toast } from "react-toastify";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config";

type Location = {
  id: string;
  name: string;
};

export default function CreateStaffPage() {
  const [email, setEmail] = useState("");
  const [locationId, setLocationId] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const isValidEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handlePreCheck = () => {
    if (!email.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setShowConfirm(true);
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE_URL}/identity/users/create-user-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email, role: "ROLE_STAFF", locationId }),
      });

      if (response.ok) {
        setSuccess(true);
        toast.success("Staff user created successfully!");
      } else {
        const errorData = await response.json();
        toast.error("Failed to create user: " + (errorData.message || "Unknown error"));
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error("Error creating user: " + error.message);
      } else {
        toast.error("An unknown error occurred");
      }
    }
  };

  const handleNextClick = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const currentPage = 1;
      const pageSize = 100;

      const response = await fetch(`${API_BASE_URL}/identity/users/get-users-admin?page=${currentPage - 1}&size=${pageSize}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        toast.error("Failed to fetch users.");
        return;
      }

      const data = await response.json();

      const matchedUser = data.result?.content?.find((user: any) => user.email === email);

      if (!matchedUser) {
        toast.error("User not found in user list.");
        return;
      }

      const userId = matchedUser.id;

      navigate(`/not-user-details/${userId}`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error("Error during navigation: " + error.message);
      } else {
        toast.error("Unknown error occurred.");
      }
    }
  };

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = localStorage.getItem("authToken");
        let allLocations: any[] = [];
        let page = 0;
        let last = false;

        while (!last) {
          const response = await fetch(`${API_BASE_URL}/app-data-service/locations/nearby?longitude=105.779303&latitude=21.028759&maxDistance=100&page=${page}&size=100`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });

          if (!response.ok) {
            toast.error("Failed to fetch locations.");
            return;
          }

          const data = await response.json();
          allLocations = allLocations.concat(data?.content || []);
          last = data.last;
          page++;
        }

        setLocations(allLocations);
      } catch (error) {
        console.error("Error fetching locations:", error);
        toast.error("Error fetching locations.");
      }
    };

    fetchLocations();
  }, []);

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-4">Create New Staff</h2>

      {!success ? (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" autoComplete="off" className="w-full border rounded-lg px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Select Location (optional)</label>
            <select className="w-full border rounded-lg px-3 py-2" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
              <option value="">-- Select Location --</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition" onClick={handlePreCheck}>
              Create
            </button>
            <button className="bg-[#d33] text-white px-4 py-2 rounded-lg hover:bg-red-700 transition" onClick={() => navigate(`/not-customer-management`)}>
              Back
            </button>
          </div>

          {showConfirm && (
            <div className="mt-4 bg-yellow-50 border border-yellow-300 p-4 rounded-lg">
              <p className="text-sm mb-3">Are you sure you want to create this user?</p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm"
                  onClick={() => {
                    setShowConfirm(false);
                    handleCreate();
                  }}
                >
                  Yes, Create
                </button>
                <button className="px-3 py-1 rounded-lg bg-[#d33] hover:bg-red-700 text-white text-sm" onClick={() => setShowConfirm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center">
          <p className="text-green-600 font-medium mb-4">✅ OK!</p>
          <button onClick={handleNextClick} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
