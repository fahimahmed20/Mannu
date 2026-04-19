"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";

interface Props {
  id: string;
  label: string;
  emoji: string;
  gradient: string; // CSS gradient string
  total: number;
}

export default function CategoryCard({ id, label, emoji, gradient, total }: Props) {
  const { getSeenCountByCategory } = useStore();
  const seen = getSeenCountByCategory(id);
  const pct = total > 0 ? Math.round((seen / total) * 100) : 0;

  return (
    <Link href={`/species?category=${id}`}>
      <div
        className="relative rounded-2xl text-white p-5 shadow-md active:scale-95 transition-transform overflow-hidden"
        style={{ background: gradient }}
      >
        <span className="absolute -right-2 -bottom-3 text-7xl opacity-20 select-none">
          {emoji}
        </span>
        <div className="relative">
          <span className="text-3xl">{emoji}</span>
          <h3 className="text-xl font-bold mt-1">{label}</h3>
          <p className="text-white/80 text-sm mt-0.5">{seen} / {total} spotted</p>
          <div className="mt-3 h-1.5 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-right text-xs text-white/70 mt-1">{pct}%</p>
        </div>
      </div>
    </Link>
  );
}
