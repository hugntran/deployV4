import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchWithAuth } from "../../api/fetchWithAuth";
import Pagination from "../ContentBottom/Pagination";
import { API_BASE_URL } from "../../config";

interface Complaint {
  id: string;
  inputEmail: string;
  userEmail: string;
  service: string;
  title: string;
  bookingId: string;
  description: string;
  images: string[];
  status: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

interface ComplaintListProps {
  searchText: string;
  statusFilter: string;
}

// Main component to display and filter the list of complaints
const ComplaintList: React.FC<ComplaintListProps> = ({ searchText, statusFilter }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const complaintsPerPage = 20;
  const location = useLocation();

  // Pagination handler
  const paginate = (page: number) => setCurrentPage(page);

  // Apply search text and status filter to the complaint list
  const filteredComplaints = complaints.filter((complaint) => {
    const matchSearch = complaint.title.toLowerCase().includes(searchText.toLowerCase()) || complaint.userEmail.toLowerCase().includes(searchText.toLowerCase());

    const matchStatus = statusFilter === "ALL" || complaint.status.toLowerCase() === statusFilter.toLowerCase();

    return matchSearch && matchStatus;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredComplaints.length / complaintsPerPage);
  const indexOfLastComplaint = currentPage * complaintsPerPage;
  const indexOfFirstComplaint = indexOfLastComplaint - complaintsPerPage;

  // Slice complaints for current page
  const currentComplaints = filteredComplaints.slice(indexOfFirstComplaint, indexOfLastComplaint);

  // Fetch data from the API and transform it into Complaint objects
  const fetchData = async () => {
    try {
      const data = await fetchWithAuth<{ content: any[] }>(`${API_BASE_URL}/dispute/api/filtered?admin=true&size=100&page=0`);

      // Map raw API data to Complaint interface
      const mappedData: Complaint[] = data.content.map((item) => ({
        id: item.id,
        inputEmail: item.inputEmail,
        userEmail: item.userEmail,
        service: item.service,
        title: item.title,
        bookingId: item.bookingId,
        description: item.description,
        images: item.images,
        status: item.status,
        createdAt: item.createdAt,
        updatedBy: item.updatedBy,
        updatedAt: item.updatedAt,
      }));

      // Sort complaints by creation date in descending order
      const sortedData = mappedData.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      // Update component state
      setComplaints(sortedData);
    } catch (err) {
      console.error("Error fetching complaints:", err);
    }
  };

  // Fetch data when the component mounts
  useEffect(() => {
    fetchData();
  }, []);

  // Re-fetch data if a complaint was updated (via navigation state)
  useEffect(() => {
    if (location.state?.updatedId) {
      fetchData();
    }
  }, [location.state]);

  return (
    <div className="pt-0 px-6 pb-6 bg-white rounded-lg shadow">
      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-200 px-4 py-2">No</th>
              <th className="border border-gray-200 px-4 py-2">Customer</th>
              <th className="border border-gray-200 px-4 py-2">Email</th>
              <th className="border border-gray-200 px-4 py-2">Title</th>
              <th className="border border-gray-200 px-4 py-2">Status</th>
              <th className="border border-gray-200 px-4 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {/* Render each complaint in the table */}
            {currentComplaints.map((complaint, index) => (
              <tr key={complaint.id} className="text-center border border-gray-200">
                <td className="px-4 py-2">{index + 1 + (currentPage - 1) * complaintsPerPage}</td>
                <td className="px-4 py-2">{complaint.inputEmail.replace("@gmail.com", "")}</td>
                <td className="px-4 py-2">{complaint.userEmail}</td>
                <td className="px-4 py-2">{complaint.title}</td>
                <td className="px-4 py-2">{complaint.status}</td>
                <td className="px-4 py-2">
                  {/* Link to detail view of complaint, passing full object via state */}
                  <Link to={`/complaint/${complaint.id}`} state={complaint} className="text-blue-500 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Render pagination component */}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={paginate} />
    </div>
  );
};

export default ComplaintList;
