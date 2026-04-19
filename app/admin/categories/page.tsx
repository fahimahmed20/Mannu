"use client";

import { useEffect, useState, useCallback } from "react";
import { PALETTES, getPalette, type PaletteId, type CategoryDef } from "@/lib/category-palettes";

interface Category extends CategoryDef {
  speciesCount?: number;
}

const emptyForm = { id: "", label: "", emoji: "🐾", paletteId: "emerald" as PaletteId };

function PalettePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(PALETTES).map(([id, p]) => (
        <button
          key={id}
          type="button"
          title={p.label}
          onClick={() => onChange(id)}
          className={`w-8 h-8 rounded-full transition-all border-2 ${
            value === id ? "scale-125 border-slate-800 shadow-md" : "border-transparent hover:scale-110"
          }`}
          style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
        />
      ))}
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [speciesCounts, setSpeciesCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState({ label: "", emoji: "", paletteId: "emerald" as PaletteId });
  const [deleteError, setDeleteError] = useState("");

  const load = useCallback(async () => {
    const [catRes, speciesRes] = await Promise.all([
      fetch("/api/admin/categories"),
      fetch("/api/admin/species"),
    ]);
    const cats: CategoryDef[] = await catRes.json();
    const species: { category: string }[] = await speciesRes.json();

    const counts: Record<string, number> = {};
    species.forEach((s) => { counts[s.category] = (counts[s.category] || 0) + 1; });

    setCategories(cats.map((c) => ({ ...c, speciesCount: counts[c.id] || 0 })));
    setSpeciesCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/categories", {
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
      setError(d.error || "Failed to create");
    }
    setSaving(false);
  }

  async function handleEdit(cat: Category) {
    await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditTarget(null);
    await load();
  }

  async function handleDelete(cat: Category) {
    setDeleteError("");
    const res = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
    if (res.ok) {
      await load();
    } else {
      const d = await res.json();
      setDeleteError(d.error || "Failed to delete");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Categories</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage species categories shown in the field guide</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setError(""); }}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          + Add Category
        </button>
      </div>

      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{deleteError}</div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4">
            <h2 className="font-semibold text-emerald-900">New Category</h2>
          </div>
          <form onSubmit={handleAdd} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">ID (URL slug) *</label>
                <input
                  required
                  value={form.id}
                  onChange={(e) => setForm({ ...form, id: e.target.value })}
                  placeholder="e.g. mammal"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-slate-400">Lowercase, used in URLs and species assignments</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Label *</label>
                <input
                  required
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. Mammals"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Emoji *</label>
                <input
                  required
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  placeholder="🐾"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Color *</label>
              <PalettePicker value={form.paletteId} onChange={(id) => setForm({ ...form, paletteId: id as PaletteId })} />
              {/* Preview card */}
              <div
                className="inline-flex items-center gap-3 text-white px-4 py-3 rounded-2xl text-sm font-semibold shadow-md mt-2"
                style={{ background: `linear-gradient(135deg, ${getPalette(form.paletteId).from}, ${getPalette(form.paletteId).to})` }}
              >
                <span className="text-2xl">{form.emoji || "🐾"}</span>
                <span>{form.label || "Category Name"}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
            )}
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                {saving ? "Creating..." : "Create Category"}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-5 py-2.5 rounded-xl text-sm transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories list */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const p = getPalette(cat.paletteId);
            return (
              <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Color header */}
                <div
                  className="h-20 flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                >
                  <span className="text-4xl">{cat.emoji}</span>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <div className="font-bold text-slate-800">{cat.label}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">id: {cat.id}</div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{cat.speciesCount ?? 0} species</span>
                    <div
                      className="w-4 h-4 rounded-full"
                      title={PALETTES[cat.paletteId]?.label}
                      style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                    />
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setEditTarget(cat);
                        setEditForm({ label: cat.label, emoji: cat.emoji, paletteId: cat.paletteId as PaletteId });
                      }}
                      className="flex-1 text-xs font-semibold py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      disabled={(cat.speciesCount ?? 0) > 0}
                      title={(cat.speciesCount ?? 0) > 0 ? "Reassign all species first" : "Delete category"}
                      className="flex-1 text-xs font-semibold py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setEditTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Edit Category</h2>
              <button onClick={() => setEditTarget(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="text-xs text-slate-400 font-mono bg-slate-50 rounded-xl px-3 py-2">id: {editTarget.id} (cannot change)</div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Label</label>
                  <input
                    value={editForm.label}
                    onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Emoji</label>
                  <input
                    value={editForm.emoji}
                    onChange={(e) => setEditForm({ ...editForm, emoji: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Color</label>
                <PalettePicker value={editForm.paletteId} onChange={(id) => setEditForm({ ...editForm, paletteId: id as PaletteId })} />
                <div
                  className="inline-flex items-center gap-3 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow mt-1"
                  style={{ background: `linear-gradient(135deg, ${getPalette(editForm.paletteId).from}, ${getPalette(editForm.paletteId).to})` }}
                >
                  <span className="text-xl">{editForm.emoji}</span>
                  <span>{editForm.label}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleEdit(editTarget)}
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
