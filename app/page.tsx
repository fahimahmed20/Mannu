"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { SPECIES, CATEGORIES } from "@/data/species";
import CategoryCard from "@/components/CategoryCard";
import Link from "next/link";
import { getPalette, type CategoryDef } from "@/lib/category-palettes";

export default function HomePage() {
  const { getSeenCount, checklistLoaded } = useStore();
  const [categories, setCategories] = useState<CategoryDef[]>(CATEGORIES);
  const totalSpecies = SPECIES.length;
  const seenCount = getSeenCount();
  const pct = totalSpecies > 0 ? Math.round((seenCount / totalSpecies) * 100) : 0;

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories).catch(() => {});
  }, []);

  return (
    <div className="page-enter">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-b from-emerald-900 via-emerald-800 to-teal-900 text-white px-5 pt-14 pb-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-emerald-300 text-xs font-semibold uppercase tracking-widest">
              Manu National Park
            </span>
          </div>
          <h1 className="text-3xl font-bold leading-tight">Field Guide</h1>
          <p className="text-emerald-200 text-sm mt-1">Peru's most biodiverse reserve</p>
          <div className="mt-6 bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Trip Progress</span>
              <span className="text-sm font-bold">
                {checklistLoaded ? `${seenCount} / ${totalSpecies}` : "—"}
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-right text-xs text-emerald-300 mt-1">{pct}% of all species spotted</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-5 pt-6">
        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Categories</h2>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => {
            const p = getPalette(cat.paletteId);
            return (
              <CategoryCard
                key={cat.id}
                id={cat.id}
                label={cat.label}
                emoji={cat.emoji}
                gradient={`linear-gradient(135deg, ${p.from}, ${p.to})`}
                total={SPECIES.filter((s) => s.category === cat.id).length}
              />
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 pt-6">
        <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/checklist">
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm active:scale-95 transition-transform">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-2">
                <svg className="w-5 h-5 fill-emerald-600" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
              <h3 className="font-semibold text-stone-800 text-sm">My Checklist</h3>
              <p className="text-stone-400 text-xs mt-0.5">{seenCount} species seen</p>
            </div>
          </Link>
          <Link href="/species">
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm active:scale-95 transition-transform">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center mb-2">
                <svg className="w-5 h-5 stroke-teal-600 fill-none" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-stone-800 text-sm">Browse All</h3>
              <p className="text-stone-400 text-xs mt-0.5">{totalSpecies} species</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Badges */}
      <div className="px-5 pt-6 pb-4 space-y-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" /></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Works Offline</p>
            <p className="text-xs text-emerald-600 mt-0.5">All species data and your checklist are saved locally — no internet needed in the field.</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-800">Cloud Sync Available</p>
            <p className="text-xs text-blue-600 mt-0.5">Sign in to backup your checklist and access it across devices.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
