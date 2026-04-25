import { create } from "zustand";
import { type Category, SPECIES as BUNDLED_SPECIES, type Species } from "@/data/species";
import { getAllChecklist, updateSeen, getUser, clearUser, type ChecklistEntry } from "@/lib/db";

export interface AppState {
  // Species (API-loaded, bundled data as initial fallback)
  species: Species[];
  loadSpecies: () => Promise<void>;

  // Checklist
  checklist: Record<string, boolean>;
  checklistLoaded: boolean;
  loadChecklist: () => Promise<void>;
  toggleSeen: (speciesId: string) => Promise<void>;

  // Filters
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  categoryFilter: Category | "all";
  setCategoryFilter: (c: Category | "all") => void;
  seenFilter: "all" | "seen" | "unseen";
  setSeenFilter: (f: "all" | "seen" | "unseen") => void;

  // Auth / User
  user: { email: string; token: string } | null;
  setUser: (user: { email: string; token: string } | null) => void;
  loadUser: () => Promise<void>;
  logout: () => Promise<void>;

  // Computed helpers
  getSeenCount: () => number;
  getSeenCountByCategory: (category: Category) => number;
  getTotalByCategory: (category: Category) => number;
}

export const useStore = create<AppState>((set, get) => ({
  // ── Species ──────────────────────────────────────────────────────────
  species: BUNDLED_SPECIES,

  loadSpecies: async () => {
    try {
      const res = await fetch("/api/species");
      if (res.ok) {
        const { species } = await res.json();
        set({ species });
      }
    } catch {
      // offline — keep bundled fallback
    }
  },

  // ── Checklist ──────────────────────────────────────────────────────
  checklist: {},
  checklistLoaded: false,

  loadChecklist: async () => {
    try {
      const entries: ChecklistEntry[] = await getAllChecklist();
      const map: Record<string, boolean> = {};
      for (const entry of entries) {
        map[entry.species_id] = entry.seen;
      }
      set({ checklist: map, checklistLoaded: true });
    } catch (error) {
      console.error("Failed to load checklist:", error);
      set({ checklistLoaded: true });
    }
  },

  toggleSeen: async (speciesId: string) => {
    const current = get().checklist[speciesId] ?? false;
    const next = !current;
    set((state) => ({
      checklist: { ...state.checklist, [speciesId]: next },
    }));
    try {
      await updateSeen(speciesId, next);
    } catch {
      set((state) => ({
        checklist: { ...state.checklist, [speciesId]: current },
      }));
    }
  },

  // ── Filters ─────────────────────────────────────────────────────────
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),

  categoryFilter: "all",
  setCategoryFilter: (c) => set({ categoryFilter: c }),

  seenFilter: "all",
  setSeenFilter: (f) => set({ seenFilter: f }),

  // ── Auth ─────────────────────────────────────────────────────────────
  user: null,
  setUser: (user) => set({ user }),

  loadUser: async () => {
    try {
      const stored = await getUser();
      if (!stored?.token || !stored?.email) return;

      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${stored.token}` },
      });

      if (res.ok) {
        const { user } = await res.json();
        set({ user: { email: user.email, token: stored.token } });
        if (typeof window !== "undefined") {
          localStorage.setItem("manu_token", stored.token);
        }
      } else {
        await clearUser();
        if (typeof window !== "undefined") {
          localStorage.removeItem("manu_token");
        }
      }
    } catch {
      // Network offline — restore from IndexedDB without server validation
      try {
        const stored = await getUser();
        if (stored?.token && stored?.email) {
          set({ user: { email: stored.email, token: stored.token } });
        }
      } catch {
        // ignore
      }
    }
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors on logout
    }
    await clearUser();
    if (typeof window !== "undefined") {
      localStorage.removeItem("manu_token");
    }
    set({ user: null });
  },

  // ── Computed ─────────────────────────────────────────────────────────
  getSeenCount: () => {
    const { checklist } = get();
    return Object.values(checklist).filter(Boolean).length;
  },

  getSeenCountByCategory: (category: Category) => {
    const { checklist, species } = get();
    return species.filter(
      (s) => s.category === category && checklist[s.id]
    ).length;
  },

  getTotalByCategory: (category: Category) => {
    return get().species.filter((s) => s.category === category).length;
  },
}));
