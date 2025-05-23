import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { parseISO } from "date-fns";
import Swal from "sweetalert2";
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

interface FormData {
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  dob: string;
  avatarUrl: string;
  newPassword: string;
  locationId: string;
}

function formatDateForInput(dob: string | null): string {
  if (!dob) return "";
  const date = new Date(dob);
  if (isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const UserEditPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const user = (location.state as { user: User }).user;
  const [showPassword, setShowPassword] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [isImageError, setIsImageError] = React.useState(false);

  const [formData, setFormData] = React.useState<FormData>({
    username: user.username,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    phone: user.phone ?? "",
    dob: formatDateForInput(user.dob),
    avatarUrl: user.avatarUrl ?? "",
    newPassword: "",
    locationId: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    // Validate password
    if (formData.newPassword && formData.newPassword.length < 8) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Password",
        text: "Hey shorty, gotta make that password at least 8 characters long, you know?",
      });
      return;
    }

    const token = localStorage.getItem("authToken");
    const payload = {
      username: formData.username,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      dob: formData.dob || null,
      avatarUrl: formData.avatarUrl || null,
      newPassword: formData.newPassword || null,
      locationId: formData.locationId || null,
    };
    console.log("Payload:", payload);

    try {
      const response = await fetch(`${API_BASE_URL}/identity/users/admin/update-user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Update user successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
        navigate(`/user-details/${userId}`);
      } else {
        const errData = await response.json();
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: "Failed to update user: " + (errData.message || response.statusText),
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: (error as Error).message,
      });
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      Swal.fire({
        icon: "error",
        title: "Authentication Error",
        text: "No authentication token found. Please log in again.",
      });
      return;
    }

    setUploading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("files", file);

      const res = await fetch(`${API_BASE_URL}/file/aws/upload-images`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataUpload,
      });

      if (!res.ok) throw new Error("Failed to upload image");

      const data = await res.json();
      const uploadedUrl = data[0]?.url || data[0];

      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, avatarUrl: uploadedUrl }));
        setIsImageError(false);
      } else {
        Swal.fire({
          icon: "error",
          title: "Upload Failed",
          text: "Image uploaded but no URL returned.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Upload Error",
        text: (error as Error).message,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Edit User</h1>

      <div className="space-y-4">
        <input name="username" value={formData.username} onChange={handleChange} placeholder="Username" className="w-full p-2 border rounded" />
        <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" className="w-full p-2 border rounded" />
        <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" className="w-full p-2 border rounded" />
        <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className="w-full p-2 border rounded" />
        <DatePicker
          selected={formData.dob && formData.dob !== "" ? parseISO(formData.dob) : null}
          onChange={(date: Date | null) => {
            setFormData((prev) => ({
              ...prev,
              dob: date ? date.toISOString().split("T")[0] : "",
            }));
          }}
          dateFormat="yyyy-MM-dd"
          placeholderText="Select Date of Birth"
          className="w-full p-2 border rounded"
        />
        <div className="border rounded-lg p-4 bg-gray-50">
          <label className="block mb-2 text-sm font-semibold text-gray-700">Avatar Image</label>

          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 rounded-full border bg-white flex items-center justify-center overflow-hidden">
              {formData.avatarUrl && !isImageError ? (
                <img src={formData.avatarUrl} alt="Avatar preview" onError={() => setIsImageError(true)} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-sm">No Image</span>
              )}
            </div>

            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:border-0 file:rounded file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
              />
              {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
              {formData.avatarUrl && !isImageError && <p className="mt-1 text-sm text-blue-600 break-all">{formData.avatarUrl}</p>}
            </div>
          </div>
        </div>
        <div className="relative">
          <input
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="New Password (leave blank to keep)"
            type={showPassword ? "text" : "password"}
            className="w-full p-2 border rounded pr-10"
            autoComplete="new-password"
          />
          <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-blue-600 hover:underline">
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <div className="flex space-x-4 mt-4">
          <button onClick={handleSubmit} disabled={uploading} className={`px-4 py-2 rounded text-white ${uploading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-800"}`}>
            {uploading ? "Uploading..." : "Save"}
          </button>
          <button onClick={() => navigate(`/user-details/${userId}`)} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-800">
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserEditPage;
