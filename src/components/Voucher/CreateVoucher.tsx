import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../config";

const initialFormState = {
  code: "",
  title: "",
  description: "",
  discountAmount: undefined,
  minimumSpentAmount: undefined,
  percentage: false,
  maxUsagePerUser: undefined,
  totalUsageLimit: undefined,
  validFrom: "",
  validUntil: "",
};

const CreateVoucher = () => {
  const [form, setForm] = useState(initialFormState);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    discountAmount: "",
    minimumSpentAmount: "",
    maxUsagePerUser: "",
    totalUsageLimit: "",
    validFrom: "",
    validUntil: "",
  });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;

    const newValue = type === "checkbox" ? checked : value;

    setForm((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    if (["discountAmount", "minimumSpentAmount", "maxUsagePerUser", "totalUsageLimit"].includes(name)) {
      validateField(name, value);
    }
  };

  const validateField = (name: string, value: string) => {
    let message = "";

    const num = Number(value);

    if (name === "discountAmount" && num <= 0) {
      message = '"Discount Amount" must be greater than 0';
    }

    if (name === "minimumSpentAmount" && num < 0) {
      message = '"Minimum Spent Amount" cannot be negative';
    }

    if (name === "maxUsagePerUser" && num <= 0) {
      message = '"Max Usage Per User" must be greater than 0';
    }

    if (name === "totalUsageLimit" && num <= 0) {
      message = '"Total Usage Limit" must be greater than 0';
    }

    setErrors((prev) => ({
      ...prev,
      [name]: message,
    }));
  };

  const validateForm = () => {
    let valid = true;
    const newErrors: any = {};

    // discountAmount, maxUsagePerUser, totalUsageLimit
    if (Number(form.discountAmount) <= 0) {
      newErrors.discountAmount = '"Discount Amount" must be greater than 0';
      valid = false;
    }

    if (Number(form.maxUsagePerUser) <= 0) {
      newErrors.maxUsagePerUser = '"Max Usage Per User" must be greater than 0';
      valid = false;
    }

    if (Number(form.totalUsageLimit) <= 0) {
      newErrors.totalUsageLimit = '"Total Usage Limit" must be greater than 0';
      valid = false;
    }

    // minimumSpentAmount
    if (Number(form.minimumSpentAmount) < 0) {
      newErrors.minimumSpentAmount = '"Minimum Spent Amount" cannot be negative';
      valid = false;
    }

    // validFrom và validUntil
    if (!form.validFrom) {
      newErrors.validFrom = '"Valid From" is required';
      valid = false;
    }
    if (!form.validUntil) {
      newErrors.validUntil = '"Valid Until" is required';
      valid = false;
    }
    if (form.validFrom && form.validUntil) {
      const from = new Date(form.validFrom);
      const until = new Date(form.validUntil);
      if (until <= from) {
        newErrors.validUntil = '"Valid Until" must be after "Valid From"';
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };

  const localToISOString = (datetimeStr: string) => {
    const localDate = new Date(datetimeStr);
    const offsetMs = localDate.getTimezoneOffset() * 60 * 1000;
    const utcDate = new Date(localDate.getTime() - offsetMs);
    return utcDate.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      Swal.fire({
        icon: "error",
        title: "Invalid Form",
        text: "Please fix the errors before submitting.",
      });
      return;
    }

    if (!thumbnailFile) {
      Swal.fire({
        icon: "warning",
        title: "Missing Thumbnail",
        text: "Please select a thumbnail image before submitting.",
        timer: 1000,
        showConfirmButton: false,
      });
      return;
    }

    const confirm = await Swal.fire({
      title: "Create Voucher?",
      text: "Are you sure you want to create this voucher?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, create",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
    });

    if (!confirm.isConfirmed) return;

    const token = localStorage.getItem("authToken");
    if (!token) return alert("No authentication token found");

    setIsSubmitting(true);
    try {
      // Upload thumbnail
      const formData = new FormData();
      formData.append("files", thumbnailFile);

      const uploadRes = await axios.post<string[]>(`${API_BASE_URL}/file/aws/upload-images`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const thumbnailURL = uploadRes.data[0];

      // Build payload
      const payload = {
        ...form,
        discountAmount: Number(form.discountAmount),
        minimumSpentAmount: Number(form.minimumSpentAmount),
        maxUsagePerUser: Number(form.maxUsagePerUser),
        totalUsageLimit: Number(form.totalUsageLimit),
        thumbnailURL,
        userSpecific: false,
        allowedUserIds: [],
        validFrom: localToISOString(form.validFrom),
        validUntil: localToISOString(form.validUntil),
      };

      await axios.post(`${API_BASE_URL}/payment/vouchers/create`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire("Success", "Voucher created successfully!", "success").then(() => {
        setTimeout(() => {
          navigate(-1);
        }, 1000);
      });
      setForm(initialFormState);
      setThumbnailFile(null);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to create voucher.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Your changes will be discarded.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb", // blue
      cancelButtonColor: "#d33", // red
      confirmButtonText: "Yes, cancel",
    });

    if (result.isConfirmed) {
      setForm(initialFormState);
      setThumbnailFile(null);
      navigate(-1);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold mb-6">Create New Voucher</h2>

      {/* Input fields */}
      <div className="space-y-4">
        <label htmlFor="code" className="block font-medium mb-1">
          Voucher Code
        </label>
        <input
          name="code"
          placeholder="Code"
          value={form.code}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="code" className="block font-medium mb-1">
          Title
        </label>
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="code" className="block font-medium mb-1">
          Description
        </label>
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="code" className="block font-medium mb-1">
          Upload image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="code" className="block font-medium mb-1">
          Discount amount
        </label>
        <input
          name="discountAmount"
          placeholder="Discount Amount"
          type="number"
          value={form.discountAmount}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.discountAmount && <p className="text-red-500 text-sm">{errors.discountAmount}</p>}
        <label htmlFor="code" className="block font-medium mb-1">
          Minimum spent amount
        </label>
        <input
          name="minimumSpentAmount"
          placeholder="Minimum Spent"
          type="number"
          value={form.minimumSpentAmount}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.minimumSpentAmount && <p className="text-red-500 text-sm">{errors.minimumSpentAmount}</p>}
        <div className="flex items-center gap-2">
          <input type="checkbox" name="percentage" checked={form.percentage} onChange={handleChange} className="h-5 w-5" />
          <label>Is Percentage?</label>
        </div>
        <label htmlFor="code" className="block font-medium mb-1">
          Max usage per user
        </label>
        <input
          name="maxUsagePerUser"
          placeholder="Max Usage Per User"
          type="number"
          value={form.maxUsagePerUser}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.maxUsagePerUser && <p className="text-red-500 text-sm">{errors.maxUsagePerUser}</p>}
        <label htmlFor="code" className="block font-medium mb-1">
          Total usage limit
        </label>
        <input
          name="totalUsageLimit"
          placeholder="Total Usage Limit"
          type="number"
          value={form.totalUsageLimit}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.totalUsageLimit && <p className="text-red-500 text-sm">{errors.totalUsageLimit}</p>}
        <label htmlFor="code" className="block font-medium mb-1">
          Valid from
        </label>
        <input
          name="validFrom"
          placeholder="Valid From"
          type="datetime-local"
          value={form.validFrom}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.validFrom && <p className="text-red-500 text-sm">{errors.validFrom}</p>}
        <label htmlFor="code" className="block font-medium mb-1">
          Valid until
        </label>
        <input
          name="validUntil"
          placeholder="Valid Until"
          type="datetime-local"
          value={form.validUntil}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.validUntil && <p className="text-red-500 text-sm">{errors.validUntil}</p>}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
          {isSubmitting ? "Submitting..." : "Create Voucher"}
        </button>
        <button type="button" onClick={handleCancel} className="px-6 py-3 bg-[#dd3333] text-white rounded-lg hover:bg-red-700">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default CreateVoucher;
