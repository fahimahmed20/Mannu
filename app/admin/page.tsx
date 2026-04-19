"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Analytics {
  species: {
    total: number;
    byCategory: { bird: number; frog: number };
    byDifficulty: { common: number; uncommon: number; rare: number };
  };
  users: {
    total: number;
    active: number;
    banned: number;
    newLast30: number;
    activeLast7: number;
    monthlyGrowth: Record<string, number>;
    topUsers: { email: string; speciesSeen: number }[];
  };
  team: { total: number; active: number };
  recentActivity: {
    id: string;
    admin: string;
    role: string;
    action: string;
    details: string;
    timestamp: string;
  }[];
}

const actionColors: Record<string, string> = {
  login: "bg-slate-400",
  add_species: "bg-emerald-500",
  edit_species: "bg-blue-500",
  delete_species: "bg-red-500",
  create_admin: "bg-purple-500",
  update_admin: "bg-amber-500",
  delete_admin: "bg-red-600",
  banned_user: "bg-orange-500",
  unbanned_user: "bg-teal-500",
  update_smtp: "bg-indigo-500",
  update_settings: "bg-slate-500",
  test_smtp: "bg-cyan-500",
  delete_user: "bg-red-500",
};

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatCard({
  label, value, sub, icon, href, accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: string;
  href?: string;
  accent: string;
}) {
  const inner = (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between">
        <div>
          <div className={`text-3xl font-black ${accent}`}>{value}</div>
          <div className="text-sm font-semibold text-slate-600 mt-1">{label}</div>
          {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  if (!data) {
    return <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Loading analytics...</div>;
  }

  const { species, users, team, recentActivity } = data;
  const maxMonth = Math.max(...Object.values(users.monthlyGrowth), 1);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800">Analytics Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Species" value={species.total} sub="In field guide" icon="🦎" accent="text-slate-800" href="/admin/species" />
        <StatCard label="App Users" value={users.total} sub={`${users.newLast30} new this month`} icon="👤" accent="text-emerald-700" href="/admin/users" />
        <StatCard label="Active (7d)" value={users.activeLast7} sub="Unique active users" icon="📱" accent="text-blue-700" />
        <StatCard label="Admin Team" value={team.total} sub={`${team.active} active`} icon="🛡️" accent="text-purple-700" href="/admin/team" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* User growth */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="font-bold text-slate-800 mb-5">User Growth (Last 6 Months)</h2>
          <div className="flex items-end gap-3 h-32">
            {Object.entries(users.monthlyGrowth).map(([month, count]) => (
              <div key={month} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs font-bold text-slate-700">{count > 0 ? count : ""}</div>
                <div
                  className="w-full bg-emerald-500 rounded-t-lg transition-all hover:bg-emerald-400"
                  style={{ height: `${Math.max((count / maxMonth) * 100, count > 0 ? 10 : 4)}%` }}
                />
                <div className="text-xs text-slate-400">{month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Category donut */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="font-bold text-slate-800 mb-5">Species by Category</h2>
          <div
            className="w-32 h-32 mx-auto rounded-full mb-5"
            style={{
              background: `conic-gradient(#10b981 0% ${(species.byCategory.bird / species.total) * 100}%, #84cc16 ${(species.byCategory.bird / species.total) * 100}% 100%)`,
            }}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-slate-600">Birds</span></div>
              <span className="font-bold text-slate-800">{species.byCategory.bird}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-lime-500" /><span className="text-slate-600">Frogs</span></div>
              <span className="font-bold text-slate-800">{species.byCategory.frog}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Difficulty breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="font-bold text-slate-800 mb-5">Species Difficulty</h2>
          <div className="space-y-4">
            {[
              { key: "common" as const, label: "Common", color: "bg-emerald-500", textColor: "text-emerald-700" },
              { key: "uncommon" as const, label: "Uncommon", color: "bg-amber-400", textColor: "text-amber-700" },
              { key: "rare" as const, label: "Rare", color: "bg-red-500", textColor: "text-red-700" },
            ].map((d) => (
              <div key={d.key}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-600 font-medium">{d.label}</span>
                  <span className={`font-bold ${d.textColor}`}>{species.byDifficulty[d.key]}</span>
                </div>
                <Bar pct={(species.byDifficulty[d.key] / species.total) * 100} color={d.color} />
              </div>
            ))}
          </div>
        </div>

        {/* User stats */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="font-bold text-slate-800 mb-5">User Status</h2>
          <div className="space-y-4">
            {[
              { label: "Active Users", value: users.active, color: "bg-emerald-500", pct: (users.active / users.total) * 100 },
              { label: "Banned", value: users.banned, color: "bg-red-500", pct: (users.banned / users.total) * 100 },
            ].map((d) => (
              <div key={d.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-600 font-medium">{d.label}</span>
                  <span className="font-bold text-slate-800">{d.value}</span>
                </div>
                <Bar pct={d.pct} color={d.color} />
              </div>
            ))}
            <div className="pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-emerald-50 rounded-xl p-3">
                  <div className="text-xl font-black text-emerald-700">{users.newLast30}</div>
                  <div className="text-xs text-emerald-600">New (30d)</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3">
                  <div className="text-xl font-black text-blue-700">{users.activeLast7}</div>
                  <div className="text-xs text-blue-600">Active (7d)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top explorers */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="font-bold text-slate-800 mb-5">Top Explorers</h2>
          <div className="space-y-3">
            {users.topUsers.map((u, i) => (
              <div key={u.email} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                  i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-slate-300 text-slate-700" : i === 2 ? "bg-amber-700 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-700 truncate">{u.email}</div>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(u.speciesSeen / 15) * 100}%` }} />
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-700 flex-shrink-0">{u.speciesSeen}/15</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity feed */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Recent Activity</h2>
          <span className="text-xs text-slate-400">{recentActivity.length} events</span>
        </div>
        {recentActivity.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No activity yet. Actions will appear here.</div>
        ) : (
          <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
            {recentActivity.map((entry) => (
              <div key={entry.id} className="flex items-start gap-4 px-6 py-3 hover:bg-slate-50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${actionColors[entry.action] || "bg-slate-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-700">{entry.details}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    by <span className="font-medium text-slate-600">{entry.admin}</span>
                    {" · "}<span className="capitalize">{entry.role}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-400 flex-shrink-0">{timeAgo(entry.timestamp)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
