const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

let apiAvailable = true;
let lastCheck = 0;
const CHECK_INTERVAL = 30000;

async function checkApiAvailability(): Promise<boolean> {
  const now = Date.now();
  if (now - lastCheck < CHECK_INTERVAL) {
    return apiAvailable;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    await fetch(`${API_BASE}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    apiAvailable = true;
  } catch {
    apiAvailable = false;
  }
  
  lastCheck = now;
  return apiAvailable;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("manu_token")
    : null;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Request failed" }));
      throw new Error(err.message || "Request failed");
    }

    apiAvailable = true;
    return res.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'TypeError' && error.message.includes('fetch')) {
      apiAvailable = false;
      throw new Error("Unable to connect to server. Please check your internet connection or try again later.");
    }
    throw error;
  }
}

export async function isApiAvailable(): Promise<boolean> {
  return checkApiAvailability();
}

export const api = {
  // Auth
  sendOtp: (email: string) =>
    request<{ message: string; otp_code?: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email: string, code: string) =>
    request<{ token: string; user: { id: number; email: string; name: string } }>(
      "/auth/verify-otp",
      { method: "POST", body: JSON.stringify({ email, code }) }
    ),

  logout: () =>
    request<{ message: string }>("/auth/logout", { method: "POST" }),

  me: () =>
    request<{ user: { id: number; email: string; name: string } }>("/auth/me"),

  // Species
  getSpecies: (category?: string) =>
    request<{ data: ApiSpecies[] }>(
      `/species${category ? `?category=${category}` : ""}`
    ),

  // Checklist
  getChecklist: () =>
    request<{ data: ApiChecklistItem[] }>("/user/checklist"),

  syncChecklist: (items: ApiChecklistItem[]) =>
    request<{ data: ApiChecklistItem[] }>("/user/checklist/sync", {
      method: "POST",
      body: JSON.stringify({ items }),
    }),

  updateChecklist: (items: ApiChecklistItem[]) =>
    request<{ message: string }>("/user/checklist/update", {
      method: "POST",
      body: JSON.stringify({ items }),
    }),
};

export interface ApiSpecies {
  id: string;
  name: string;
  scientific_name: string;
  category: "bird" | "frog";
  image: string;
  description: string;
  habitat: string;
  difficulty: "common" | "uncommon" | "rare";
}

export interface ApiChecklistItem {
  species_id: string;
  seen: boolean;
  timestamp: number;
}
