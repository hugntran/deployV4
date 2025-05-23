export async function fetchWithAuth<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Token 404");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Fetch failed: ${message}`);
  }

  return response.json();
}
