"use client";

import Link from "next/link";
import OfflineImage from "@/components/OfflineImage";
import { useStore } from "@/lib/store";
import type { Species } from "@/data/species";

interface Props {
  species: Species;
}

const DIFFICULTY_BADGE: Record<string, string> = {
  common: "bg-green-100 text-green-700",
  uncommon: "bg-amber-100 text-amber-700",
  rare: "bg-red-100 text-red-700",
};

export default function SpeciesCard({ species }: Props) {
  const { checklist, toggleSeen } = useStore();
  const seen = checklist[species.id] ?? false;

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleSeen(species.id);
  }

  return (
    <Link href={`/species/${species.id}`}>
      <div
        className={`relative rounded-2xl overflow-hidden bg-white shadow-sm border transition-all active:scale-95 ${
          seen
            ? "border-emerald-300 shadow-emerald-100"
            : "border-stone-200"
        }`}
      >
        {/* Image */}
        <div className="relative h-52 bg-stone-100">
          <OfflineImage
            src={species.image}
            alt={species.name}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 50vw, 33vw"
            loading="lazy"
          />
          {seen && (
            <div className="absolute inset-0 bg-emerald-900/20 flex items-center justify-center">
              <div className="bg-emerald-500 rounded-full p-1.5">
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
            </div>
          )}
          {/* Difficulty badge */}
          <span
            className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${DIFFICULTY_BADGE[species.difficulty]}`}
          >
            {species.difficulty}
          </span>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-semibold text-stone-800 text-sm leading-tight truncate">
            {species.name}
          </h3>
          <p className="text-stone-400 text-[11px] italic truncate mt-0.5">
            {species.scientific_name}
          </p>

          {/* Seen toggle */}
          <button
            onClick={handleToggle}
            className={`mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              seen
                ? "bg-emerald-500 text-white"
                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            {seen ? (
              <>
                <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                Seen
              </>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5 stroke-stone-400 fill-none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
                Mark as Seen
              </>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
