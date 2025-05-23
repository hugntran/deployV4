import { useEffect, useState } from "react";
import { fetchWithAuth } from "../api/fetchWithAuth";

interface FetchOptions<T> {
  url: string;
  filterFn?: (data: any) => T[];
  trigger?: any;
}

/**
 * Custom hook
 *
 * @param {FetchOptions} options
 * @returns {Object}
 */
export function useFetchData<T = any>({ url, filterFn, trigger }: FetchOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await fetchWithAuth(url);

        const content = res?.content || [];

        const filtered = filterFn ? filterFn(content) : content;

        setData(filtered);
      } catch (err) {
        console.error(err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, trigger]);

  return { data, loading, error };
}
