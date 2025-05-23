import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { fetchWithAuth } from "../../api/fetchWithAuth";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { API_BASE_URL } from "../../config";

const MySwal = withReactContent(Swal);

interface Complaint {
  id: string;
  userEmail: string;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
  service: string;
  title: string;
  description: string;
  images?: string[];
  status: string;
}

const ComplaintDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const complaint = location.state as Complaint | null;

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!complaint) {
    return <div className="p-6">Complaint not found.</div>;
  }

  const handleBack = () => {
    navigate("/admin-complaint-page");
  };

  const handleConfirmProcess = async () => {
    const result = await MySwal.fire({
      title: "Are you sure?",
      text: "Do you want to mark this complaint as resolved?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
      confirmButtonText: "Just do it",
    });

    if (result.isConfirmed) {
      setIsProcessing(true);
      try {
        await fetchWithAuth(`${API_BASE_URL}/dispute/api/update/${complaint.id}`, {
          method: "PUT",
          body: JSON.stringify({ disputeStatus: "COMPLETE" }),
        });

        toast.success("Complaint resolved successfully.");
        navigate("/admin-complaint-page", { state: { updatedId: complaint.id } });
      } catch (error) {
        console.error("Error resolving complaint:", error);
        toast.error("Failed to resolve complaint. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="relative max-w-4xl mx-auto p-6 bg-white rounded-lg shadow space-y-6 text-sm">
      {/* Complaint Number */}
      <div className="text-right font-semibold">
        <span className="bg-gray-100 p-2 border rounded">Complaint Number: {complaint.id.slice(0, 8).toUpperCase()}</span>
      </div>

      {/* Complaint Details */}
      <div>
        <h3 className="text-lg font-bold border-b pb-1 mb-2">Complaint Details</h3>
        <table className="w-full table-fixed border border-gray-300">
          <tbody>
            <tr className="border-b">
              <td className="border px-3 py-2 font-semibold">Customer</td>
              <td className="border px-3 py-2">{complaint.userEmail.split("@")[0]}</td>
              <td className="border px-3 py-2 font-semibold">E-Mail:</td>
              <td className="border px-3 py-2">{complaint.userEmail}</td>
            </tr>
            <tr className="border-b">
              <td className="border px-3 py-2 font-semibold">Date of Complaint:</td>
              <td className="border px-3 py-2">{new Date(complaint.createdAt).toLocaleDateString()}</td>
              <td className="border px-3 py-2 font-semibold">Hour of Complaint:</td>
              <td className="border px-3 py-2">{new Date(complaint.createdAt).toLocaleTimeString()}</td>
            </tr>
            <tr>
              <td className="border px-3 py-2 font-semibold">Service Affected:</td>
              <td className="border px-3 py-2" colSpan={3}>
                {complaint.service}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* The Complaint */}
      <div>
        <h3 className="text-lg font-bold border-b pb-1 mb-2">The Complaint</h3>
        <div className="bg-gray-50 p-4 rounded space-y-3">
          <p className="font-semibold">{complaint.title}</p>
          <p>{complaint.description}</p>
          {Array.isArray(complaint.images) && complaint.images.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-3">
              {complaint.images.map((url: string, idx: number) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Image-${idx}`}
                  className="w-32 h-32 object-cover border rounded cursor-pointer"
                  onClick={() => setSelectedImage(url)}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/images/country/anh-27-meme-dang-yeu-didongmy.jpg";
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Complaint Resolution */}
      <div>
        <h3 className="text-lg font-bold border-b pb-1 mb-2">Complaint handled at</h3>
        <table className="w-full table-fixed border border-gray-300">
          <tbody>
            <tr className="border-b">
              <td className="border px-3 py-2 font-semibold">Handled on:</td>
              <td className="border px-3 py-2">{complaint.updatedBy ? new Date(complaint.updatedAt || "").toLocaleString() : "N/A"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Buttons */}
      <div className="pt-4 flex justify-end gap-3">
        {complaint.status !== "COMPLETE" && (
          <button onClick={handleConfirmProcess} disabled={isProcessing} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50">
            {isProcessing ? "Processing..." : "Resolve"}
          </button>
        )}
        <button onClick={handleBack} className="px-4 py-2 bg-[#d33] hover:bg-[#a00] text-white rounded">
          Back
        </button>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative bg-white p-2 rounded shadow-lg max-w-[600px] max-h-[80vh] w-full" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Enlarged" className="w-full h-auto max-h-[70vh] object-contain rounded" />
            <button onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-600">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetail;
