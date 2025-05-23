import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "../ContentBottom/Pagination";
import { API_BASE_URL } from "../../config";

interface User {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  dob: string | null;
  roles: Role[];
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
}

interface Role {
  name: string;
  description: string;
  permissions: string[];
}

interface CustomerManagementListProps {
  searchText: string;
  statusFilter: string;
}

const CustomerManagementList: React.FC<CustomerManagementListProps> = ({ searchText, statusFilter }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const pageSize = 100;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        if (!token) {
          setError("No token found");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/identity/users/get-users-admin?page=${currentPage - 1}&size=${pageSize}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();

        const filteredByRole = data.result.content.filter((user: User) => user.roles.some((role) => role.name === "USER"));

        setUsers(filteredByRole);
        setTotalPages(data.result.totalPages);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage]);

  // Filter by searchText, roleFilter and statusFilter
  const filteredUsers = users.filter((user) => {
    const searchValue = searchText.toLowerCase();
    const statusMatches = statusFilter ? (statusFilter === "Verified" ? user.emailVerified : !user.emailVerified) : true;

    const usernameMatch = user.username?.toLowerCase().includes(searchValue);
    const emailMatch = user.email?.toLowerCase().includes(searchValue);
    const phoneMatch = user.phone?.toLowerCase().includes(searchValue);

    return (usernameMatch || emailMatch || phoneMatch) && statusMatches;
  });

  if (loading) return <p>Loading users...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-4">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">No</th>
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Phone number</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Status</th>
            <th className="border px-4 py-2">Details</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user, index) => (
            <tr key={user.id} className="text-center">
              <td className="border px-4 py-2">{(currentPage - 1) * pageSize + index + 1}</td>
              <td className="border px-4 py-2">{user.username ? user.username.split("@")[0] : "N/A"}</td>
              <td className="border px-4 py-2">{user.phone}</td>
              <td className="border px-4 py-2">{user.email}</td>
              <td className="border px-4 py-2">{user.emailVerified ? "Verified" : "Unverified"}</td>
              <td className="border px-4 py-2">
                <Link to={`/user-details/${user.id}`} className="text-blue-500 hover:text-blue-700">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
    </div>
  );
};

export default CustomerManagementList;
