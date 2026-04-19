"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdmin } from "@/app/admin/layout";

interface TeamMember {
  id: string;
  username: string;
  email: string;
  role: "superadmin" | "admin" | "editor";
  active: boolean;
  createdAt: string;
  lastLogin: string | null;
}

const roleBadge: Record<string, string> = {
  superadmin: "bg-amber-100 text-amber-700 border-amber-200",
  admin: "bg-blue-100 text-blue-700 border-blue-200",
  editor: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const roleDesc: Record<string, string> = {
  superadmin: "Full access — team, settings, SMTP, users, species",
  admin: "Can manage users, species, and view settings",
  editor: "Can only manage species content",
};

function fmt(ts: string | null) {
  if (!ts) return "Never";
  if (ts === "built-in") return "Built-in";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const emptyForm = { username: "", email: "", password: "", role: "editor" as "admin" | "editor" };

export default function TeamPage() {
  const currentUser = useAdmin();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState<"admin" | "editor">("editor");
  const [newPassword, setNewPassword] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/team");
    setMembers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const isSuperAdmin = currentUser?.role === "superadmin";

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setAddError("");
    const res = await fetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm(emptyForm);
      setShowAdd(false);
      await load();
    } else {
      const d = await res.json();
      setAddError(d.error || "Failed to create");
    }
    setAddLoading(false);
  }

  async function handleEdit(id: string) {
    const body: Record<string, unknown> = { role: editRole };
    if (newPassword) body.password = newPassword;
    await fetch(`/api/admin/team/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setEditTarget(null);
    setNewPassword("");
    await load();
  }

  async function toggleActive(member: TeamMember) {
    await fetch(`/api/admin/team/${member.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !member.active }),
    });
    await load();
  }

  async function deleteMember(member: TeamMember) {
    if (!confirm(`Remove "${member.username}" from the admin team?`)) return;
    await fetch(`/api/admin/team/${member.id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Admin Team</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage who has access to this admin panel</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => { setShowAdd(true); setAddError(""); }}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
          >
            + Add Member
          </button>
        )}
      </div>

      {/* Role guide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(["superadmin", "admin", "editor"] as const).map((role) => (
          <div key={role} className={`rounded-xl border p-4 ${roleBadge[role]}`}>
            <div className="font-bold capitalize text-sm">{role}</div>
            <div className="text-xs mt-1 opacity-80">{roleDesc[role]}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showAdd && isSuperAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4">
            <h2 className="font-semibold text-emerald-900">Invite New Admin</h2>
          </div>
          <form onSubmit={handleAdd} className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {[
                { field: "username", label: "Username", placeholder: "johndoe", type: "text" },
                { field: "email", label: "Email", placeholder: "john@example.com", type: "email" },
                { field: "password", label: "Password", placeholder: "Strong password", type: "password" },
              ].map(({ field, label, placeholder, type }) => (
                <div key={field} className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label} *</label>
                  <input
                    required
                    type={type}
                    value={form[field as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              ))}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as "admin" | "editor" })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                </select>
              </div>
            </div>
            {addError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{addError}</div>
            )}
            <div className="flex gap-3">
              <button type="submit" disabled={addLoading} className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                {addLoading ? "Creating..." : "Create Admin"}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-5 py-2.5 rounded-xl text-sm transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${
                  m.role === "superadmin" ? "bg-amber-100 text-amber-700" :
                  m.role === "admin" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                }`}>
                  {m.username.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">{m.username}</span>
                    {m.id === "superadmin" && (
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">built-in</span>
                    )}
                    {!m.active && m.id !== "superadmin" && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Disabled</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {m.email !== "—" ? m.email : "superadmin@env"} · Last login: {fmt(m.lastLogin)}
                  </div>
                </div>

                <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold flex-shrink-0 ${roleBadge[m.role]}`}>
                  {m.role}
                </span>

                {isSuperAdmin && m.id !== "superadmin" && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setEditTarget(m); setEditRole(m.role as "admin" | "editor"); setNewPassword(""); }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2.5 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleActive(m)}
                      className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                        m.active ? "text-orange-600 hover:bg-orange-50" : "text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      {m.active ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => deleteMember(m)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Edit {editTarget.username}</h2>
              <button onClick={() => setEditTarget(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Role</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as "admin" | "editor")}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">New Password (optional)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleEdit(editTarget.id)}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Save Changes
              </button>
              <button onClick={() => setEditTarget(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-xl text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
