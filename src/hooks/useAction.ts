import { toast } from "react-toastify";
import { useState } from "react";

interface ActionHook {
  url: string;
  successMessage: string;
  errorMessage: string;
}

/**
 * Custom hook (checkin, checkout, v.v.)
 * @param {ActionHook} params
 * @returns {Object} - { handleAction, loadingIndex }
 */

export function useAction({ url, successMessage, errorMessage }: ActionHook) {
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const handleAction = async (requestId: string, index: number, onSuccess?: () => void) => {
    try {
      setLoadingIndex(index);

      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("Token 404");

      const response = await fetch(url.replace(":id", requestId), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Bug from server: ${text}`);
      }

      toast.success(successMessage);
      onSuccess?.();
    } catch (err) {
      console.error(errorMessage, err);
      toast.error(errorMessage);
    } finally {
      setLoadingIndex(null);
    }
  };

  return { handleAction, loadingIndex };
}
