"use client";

import { Suspense } from "react";
import Link from "next/link";
import OfflineImage from "@/components/OfflineImage";
import { useStore } from "@/lib/store";
import { CATEGORIES } from "@/data/species";
import type { Category } from "@/data/species";

function SeenSpeciesRow({ speciesId }: { speciesId: string }) {
  const { toggleSeen, species: allSpecies } = useStore();
  const species = allSpecies.find((s) => s.id === speciesId);
  if (!species) return null;

  return (
    <Link href={`/species/${species.id}`}>
      <div className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-stone-200 shadow-sm active:scale-95 transition-transform">
        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
          <OfflineImage
            src={species.image}
            alt={species.name}
            fill
            className="object-cover"
            sizes="56px"
            loading="lazy"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-stone-800 text-sm truncate">
            {species.name}
          </p>
          <p className="text-stone-400 text-[11px] italic truncate">
            {species.scientific_name}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSeen(species.id);
          }}
          className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0"
        >
          <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </button>
      </div>
    </Link>
  );
}

function ChecklistContent() {
  const { checklist, checklistLoaded, getSeenCountByCategory, getTotalByCategory, species: allSpecies } =
    useStore();

  const validIds = new Set(allSpecies.map((s) => s.id));
  const seenIds = Object.entries(checklist)
    .filter(([id, v]) => v && validIds.has(id))
    .map(([k]) => k);

  const totalSeen = seenIds.length;
  const totalAll = allSpecies.length;

  if (!checklistLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center text-stone-400">
          <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading checklist...</p>
        </div>
      </div>
    );
  }

  if (totalSeen === 0) {
    return (
      <div className="page-enter px-5 pt-10 flex flex-col items-center justify-center text-center">
        <div className="text-7xl mb-4">🌿</div>
        <h2 className="text-xl font-bold text-stone-700">
          No sightings yet
        </h2>
        <p className="text-stone-400 text-sm mt-2 max-w-xs">
          Head to the Species Guide and mark animals as you spot them in the
          field.
        </p>
        <Link
          href="/species"
          className="mt-6 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-semibold text-sm active:scale-95 transition-transform"
        >
          Browse Species
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter px-5 pt-6">
      <h1 className="text-2xl font-bold text-stone-800">My Checklist</h1>
      <p className="text-stone-400 text-sm mt-1">
        {totalSeen} of {totalAll} species spotted
      </p>

      {/* Overall progress bar */}
      <div className="mt-4 bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
        <div className="flex justify-between text-xs text-stone-500 mb-2">
          <span>Total Progress</span>
          <span className="font-semibold text-emerald-700">
            {Math.round((totalSeen / totalAll) * 100)}%
          </span>
        </div>
        <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(totalSeen / totalAll) * 100}%` }}
          />
        </div>
      </div>

      {/* Grouped by category */}
      <div className="mt-6 space-y-6">
        {CATEGORIES.map((cat) => {
          const catSeenIds = seenIds.filter((id) => {
            const s = allSpecies.find((sp) => sp.id === id);
            return s?.category === cat.id;
          });
          if (catSeenIds.length === 0) return null;

          const seenInCat = getSeenCountByCategory(cat.id as Category);
          const totalInCat = getTotalByCategory(cat.id as Category);

          return (
            <div key={cat.id}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{cat.emoji}</span>
                  <h2 className="font-bold text-stone-700">{cat.label}</h2>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cat.bgLight} ${cat.textColor}`}>
                  {seenInCat} / {totalInCat}
                </span>
              </div>
              <div className="space-y-2">
                {catSeenIds.map((id) => (
                  <SeenSpeciesRow key={id} speciesId={id} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ChecklistPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-stone-400">
            <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading checklist...</p>
          </div>
        </div>
      }
    >
      <ChecklistContent />
    </Suspense>
  );
}
