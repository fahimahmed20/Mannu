"use client";

import { useEffect, useState, useCallback } from "react";

interface AppUser {
  id: string;
  email: string;
  active: boolean;
  banned: boolean;
  joinedAt: string;
  lastSeen: string;
  speciesSeen: number;
  role: string;
}

function fmt(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  return fmt(ts);
}

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [filtered, setFiltered] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "banned">("all");
  const [selected, setSelected] = useState<AppUser | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    setUsers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let r = [...users];
    if (search) r = r.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter === "active") r = r.filter((u) => !u.banned);
    if (statusFilter === "banned") r = r.filter((u) => u.banned);
    setFiltered(r);
  }, [users, search, statusFilter]);

  async function toggleBan(user: AppUser) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banned: !user.banned }),
    });
    setSelected(null);
    await load();
  }

  async function deleteUser(user: AppUser) {
    if (!confirm(`Permanently delete user "${user.email}"?`)) return;
    await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    setSelected(null);
    await load();
  }

  const stats = {
    total: users.length,
    active: users.filter((u) => !u.banned).length,
    banned: users.filter((u) => u.banned).length,
    avgSeen: users.length ? Math.round(users.reduce((a, u) => a + u.speciesSeen, 0) / users.length) : 0,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">App Users</h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage registered field guide users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-slate-800", bg: "bg-white" },
          { label: "Active", value: stats.active, color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "Banned", value: stats.banned, color: "text-red-600", bg: "bg-red-50" },
          { label: "Avg Species Seen", value: stats.avgSeen, color: "text-blue-700", bg: "bg-blue-50" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-5 border border-slate-200 shadow-sm`}>
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-sm text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email..."
          className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Users</option>
          <option value="active">Active Only</option>
          <option value="banned">Banned Only</option>
        </select>
        {(search || statusFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setStatusFilter("all"); }}
            className="text-sm text-slate-400 hover:text-slate-700 px-3"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading users...</div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Email", "Joined", "Last Seen", "Species Seen", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-bold text-emerald-700 flex-shrink-0">
                            {u.email[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-slate-800">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">{fmt(u.joinedAt)}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-500">{timeAgo(u.lastSeen)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden w-16">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(u.speciesSeen / 15) * 100}%` }} />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{u.speciesSeen}/15</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.banned ? (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 font-medium">Banned</span>
                        ) : (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium">Active</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelected(u)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => toggleBan(u)}
                            className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                              u.banned
                                ? "text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                                : "text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                            }`}
                          >
                            {u.banned ? "Unban" : "Ban"}
                          </button>
                          <button
                            onClick={() => deleteUser(u)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtered.map((u) => (
                <div key={u.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800 truncate">{u.email}</span>
                    {u.banned ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex-shrink-0">Banned</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">Active</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">Joined {fmt(u.joinedAt)} · Last seen {timeAgo(u.lastSeen)}</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(u.speciesSeen / 15) * 100}%` }} />
                    </div>
                    <span className="text-xs text-slate-600">{u.speciesSeen}/15 species</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => toggleBan(u)} className={`text-xs font-medium px-3 py-1.5 rounded-lg ${u.banned ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>
                      {u.banned ? "Unban" : "Ban"}
                    </button>
                    <button onClick={() => deleteUser(u)} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50 text-red-600">Delete</button>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">No users match your filters.</div>
            )}
          </>
        )}
      </div>

      {/* User detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800">User Details</h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl font-black text-emerald-700 mx-auto">
              {selected.email[0].toUpperCase()}
            </div>
            <div className="space-y-2 text-sm">
              {[
                { label: "Email", value: selected.email },
                { label: "Joined", value: fmt(selected.joinedAt) },
                { label: "Last Seen", value: timeAgo(selected.lastSeen) },
                { label: "Species Seen", value: `${selected.speciesSeen} / 15` },
                { label: "Status", value: selected.banned ? "Banned" : "Active" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">{row.label}</span>
                  <span className="text-slate-800 font-semibold">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => toggleBan(selected)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  selected.banned ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-orange-100 hover:bg-orange-200 text-orange-700"
                }`}
              >
                {selected.banned ? "Unban User" : "Ban User"}
              </button>
              <button
                onClick={() => deleteUser(selected)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
