import { create } from "zustand";
import { type Category, SPECIES } from "@/data/species";
import { getAllChecklist, updateSeen, type ChecklistEntry } from "@/lib/db";

export interface AppState {
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

  // Computed helpers
  getSeenCount: () => number;
  getSeenCountByCategory: (category: Category) => number;
  getTotalByCategory: (category: Category) => number;
}

export const useStore = create<AppState>((set, get) => ({
  // ── Checklist ──────────────────────────────────────────────────
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
      // Roll back on DB error
      set((state) => ({
        checklist: { ...state.checklist, [speciesId]: current },
      }));
    }
  },

  // ── Filters ────────────────────────────────────────────────────
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),

  categoryFilter: "all",
  setCategoryFilter: (c) => set({ categoryFilter: c }),

  seenFilter: "all",
  setSeenFilter: (f) => set({ seenFilter: f }),

  // ── Auth ───────────────────────────────────────────────────────
  user: null,
  setUser: (user) => set({ user }),

  // ── Computed ───────────────────────────────────────────────────
  getSeenCount: () => {
    const { checklist } = get();
    return Object.values(checklist).filter(Boolean).length;
  },

  getSeenCountByCategory: (category: Category) => {
    const { checklist } = get();
    return SPECIES.filter(
      (s) => s.category === category && checklist[s.id]
    ).length;
  },

  getTotalByCategory: (category: Category) => {
    return SPECIES.filter((s) => s.category === category).length;
  },
}));
