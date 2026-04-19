"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Home",
    icon: (active: boolean) => (
      <svg
        className={`w-6 h-6 ${active ? "fill-emerald-600" : "fill-stone-400"}`}
        viewBox="0 0 24 24"
      >
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    href: "/species",
    label: "Species",
    icon: (active: boolean) => (
      <svg
        className={`w-6 h-6 ${active ? "stroke-emerald-600" : "stroke-stone-400"} fill-none`}
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
        />
      </svg>
    ),
  },
  {
    href: "/checklist",
    label: "My List",
    icon: (active: boolean) => (
      <svg
        className={`w-6 h-6 ${active ? "stroke-emerald-600" : "stroke-stone-400"} fill-none`}
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4M7 4h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
        />
      </svg>
    ),
  },
  {
    href: "/login",
    label: "Sync",
    icon: (active: boolean) => (
      <svg
        className={`w-6 h-6 ${active ? "stroke-emerald-600" : "stroke-stone-400"} fill-none`}
        viewBox="0 0 24 24"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 safe-area-pb">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors min-w-[56px] ${
                active ? "bg-emerald-50" : "hover:bg-stone-50"
              }`}
            >
              {icon(active)}
              <span
                className={`text-[10px] font-medium ${
                  active ? "text-emerald-600" : "text-stone-400"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
