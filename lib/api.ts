async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("manu_token") : null;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Request failed");
  }

  return res.json();
}

export const api = {
  sendOtp: (email: string) =>
    request<{ message: string; otp_code?: string }>("/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email: string, code: string) =>
    request<{ token: string; user: { id: string; email: string } }>(
      "/api/auth/verify-otp",
      { method: "POST", body: JSON.stringify({ email, code }) }
    ),

  logout: () =>
    request<{ message: string }>("/api/auth/logout", { method: "POST" }),

  me: () =>
    request<{ user: { id: string; email: string } }>("/api/auth/me"),
};

export interface ApiChecklistItem {
  species_id: string;
  seen: boolean;
  timestamp: number;
}
