"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { SPECIES } from "@/data/species";
import SpeciesCard from "@/components/SpeciesCard";
import SearchBar from "@/components/SearchBar";
import FilterBar from "@/components/FilterBar";
import SkeletonCard from "@/components/SkeletonCard";

export default function SpeciesPage() {
  const {
    searchQuery,
    categoryFilter,
    seenFilter,
    checklist,
    checklistLoaded,
  } = useStore();

  const filtered = useMemo(() => {
    return SPECIES.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.scientific_name.toLowerCase().includes(q);

      const matchCategory =
        categoryFilter === "all" || s.category === categoryFilter;

      const isSeen = checklist[s.id] ?? false;
      const matchSeen =
        seenFilter === "all" ||
        (seenFilter === "seen" && isSeen) ||
        (seenFilter === "unseen" && !isSeen);

      return matchSearch && matchCategory && matchSeen;
    });
  }, [searchQuery, categoryFilter, seenFilter, checklist]);

  return (
    <div className="page-enter px-5 pt-6">
      <h1 className="text-2xl font-bold text-stone-800 mb-5">
        Species Guide
      </h1>

      <div className="space-y-3 mb-4">
        <SearchBar />
        <FilterBar />
      </div>

      <p className="text-xs text-stone-400 mb-3">
        {filtered.length} species found
      </p>

      {!checklistLoaded ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <div className="text-5xl mb-3">🔍</div>
          <p className="font-medium text-stone-600">No species found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((s) => (
            <SpeciesCard key={s.id} species={s} />
          ))}
        </div>
      )}
    </div>
  );
}
