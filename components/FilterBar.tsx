"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/data/species";
import { getPalette, type CategoryDef } from "@/lib/category-palettes";

export default function FilterBar() {
  const { categoryFilter, setCategoryFilter, seenFilter, setSeenFilter } = useStore();
  const [categories, setCategories] = useState<CategoryDef[]>(CATEGORIES);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories).catch(() => {});
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            categoryFilter === "all"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-white text-stone-600 border border-stone-200"
          }`}
        >
          All
        </button>
        {categories.map((cat) => {
          const palette = getPalette(cat.paletteId);
          const active = categoryFilter === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors border"
              style={
                active
                  ? { background: palette.from, color: "#fff", borderColor: palette.from }
                  : { background: "#fff", color: "#57534e", borderColor: "#e7e5e4" }
              }
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        {(["all", "seen", "unseen"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setSeenFilter(f)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
              seenFilter === f
                ? "bg-stone-800 text-white"
                : "bg-white text-stone-500 border border-stone-200"
            }`}
          >
            {f === "all" ? "All" : f === "seen" ? "✓ Seen" : "○ Not Seen"}
          </button>
        ))}
      </div>
    </div>
  );
}
