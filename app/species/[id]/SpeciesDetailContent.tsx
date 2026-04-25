"use client";

import { use } from "react";
import Link from "next/link";
import OfflineImage from "@/components/OfflineImage";
import { notFound } from "next/navigation";
import { getSpeciesById, CATEGORIES } from "@/data/species";
import { useStore } from "@/lib/store";

const DIFFICULTY_LABEL: Record<string, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  common: "bg-green-100 text-green-700 border-green-200",
  uncommon: "bg-amber-100 text-amber-700 border-amber-200",
  rare: "bg-red-100 text-red-700 border-red-200",
};

export default function SpeciesDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const species = getSpeciesById(id);
  if (!species) notFound();

  const { checklist, toggleSeen } = useStore();
  const seen = checklist[species.id] ?? false;

  const category = CATEGORIES.find((c) => c.id === species.category);

  return (
    <div className="page-enter">
      {/* Back button */}
      <div className="sticky top-0 z-10 bg-stone-50/90 backdrop-blur-sm px-4 pt-3 pb-2">
        <Link
          href="/species"
          className="inline-flex items-center gap-1.5 text-emerald-700 font-medium text-sm"
        >
          <svg
            className="w-4 h-4 stroke-emerald-700 fill-none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </Link>
      </div>

      {/* Hero image */}
      <div className="relative mx-5 mt-1 rounded-3xl overflow-hidden h-64 bg-stone-200 shadow-lg">
        <OfflineImage
          src={species.image}
          alt={species.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 640px"
          priority
        />
        {seen && (
          <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow">
            <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            Seen
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 pt-5 space-y-5">
        {/* Title row */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold text-stone-900">
                {species.name}
              </h1>
              <p className="text-stone-400 italic text-sm mt-0.5">
                {species.scientific_name}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border ${DIFFICULTY_COLOR[species.difficulty]}`}
            >
              {DIFFICULTY_LABEL[species.difficulty]}
            </span>
            {category && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border ${category.bgLight} ${category.textColor} ${category.borderColor}`}
              >
                {category.emoji} {category.label}
              </span>
            )}
          </div>
        </div>

        {/* Habitat */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-teal-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 stroke-teal-600 fill-none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"
                />
                <circle cx="12" cy="11" r="3" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Habitat
            </span>
          </div>
          <p className="text-stone-700 text-sm">{species.habitat}</p>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 stroke-emerald-600 fill-none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6M9 16h6M9 8h3m3 8V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"
                />
              </svg>
            </div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
              About
            </span>
          </div>
          <p className="text-stone-700 text-sm leading-relaxed">
            {species.description}
          </p>
        </div>

        {/* Seen toggle — big CTA */}
        <button
          onClick={() => toggleSeen(species.id)}
          className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm ${
            seen
              ? "bg-emerald-500 text-white shadow-emerald-200"
              : "bg-stone-800 text-white"
          }`}
        >
          {seen ? (
            <>
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              Spotted! Tap to undo
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 stroke-white fill-none"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path strokeLinecap="round" d="M8 12h8M12 8v8" />
              </svg>
              Mark as Seen
            </>
          )}
        </button>
      </div>
    </div>
  );
}
