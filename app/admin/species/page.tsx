"use client";

import { useEffect, useState, useCallback, useRef, useId } from "react";

const CSV_HEADERS = ["name", "scientific_name", "category", "image", "description", "habitat", "difficulty"] as const;

function exportToCsv(species: Species[]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = [
    CSV_HEADERS.join(","),
    ...species.map((s) =>
      CSV_HEADERS.map((h) => escape(s[h] ?? "")).join(",")
    ),
  ];
  const blob = new Blob([rows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "species-export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        values.push(cur); cur = "";
      } else {
        cur += ch;
      }
    }
    values.push(cur);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (values[i] ?? "").trim(); });
    return obj;
  });
}

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const inputId = useId();
  const [rows, setRows] = useState<Record<string, string>[] | null>(null);
  const [filename, setFilename] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ added: number; skipped: number; errors: string[] } | null>(null);
  const [parseError, setParseError] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    setResult(null);
    setParseError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseCsv(ev.target?.result as string);
        if (parsed.length === 0) { setParseError("No data rows found in file."); return; }
        const missing = CSV_HEADERS.filter((h) => !(h in parsed[0]));
        if (missing.length > 0) { setParseError(`Missing columns: ${missing.join(", ")}`); return; }
        setRows(parsed);
      } catch {
        setParseError("Failed to parse CSV.");
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!rows) return;
    setImporting(true);
    const res = await fetch("/api/admin/species/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rows),
    });
    const data = await res.json();
    setResult(data);
    setImporting(false);
    if (data.added > 0) onImported();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200">
          <h2 className="font-bold text-slate-800 text-lg">Import Species from CSV</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700">Required CSV columns:</p>
            <p className="font-mono">{CSV_HEADERS.join(", ")}</p>
            <p className="text-slate-400 mt-1">difficulty must be: common, uncommon, or rare</p>
          </div>

          <div>
            <label htmlFor={inputId} className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              CSV File
            </label>
            <label
              htmlFor={inputId}
              className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-emerald-400 rounded-xl p-8 cursor-pointer transition-colors"
            >
              <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-slate-600">
                {filename ? filename : "Click to choose a .csv file"}
              </span>
              <input id={inputId} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
            </label>
          </div>

          {parseError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{parseError}</div>
          )}

          {rows && !result && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl px-4 py-3">
              <span className="font-semibold">{rows.length} rows</span> ready to import from <span className="font-mono">{filename}</span>
            </div>
          )}

          {result && (
            <div className="space-y-2">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
                <span className="font-semibold">{result.added} added</span>
                {result.skipped > 0 && <span className="text-slate-500">, {result.skipped} skipped (already exist)</span>}
              </div>
              {result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 space-y-1">
                  {result.errors.map((e, i) => <div key={i}>{e}</div>)}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            {!result ? (
              <button
                onClick={handleImport}
                disabled={!rows || importing}
                className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                {importing ? "Importing..." : "Import"}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                Done
              </button>
            )}
            <button onClick={onClose} className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium px-5 py-2.5 rounded-xl text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MediaEntry {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  type: string;
}

function ImagePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [tab, setTab] = useState<"url" | "library">("url");
  const [media, setMedia] = useState<MediaEntry[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadMedia() {
    setLoadingMedia(true);
    const res = await fetch("/api/admin/media");
    setMedia(await res.json());
    setLoadingMedia(false);
  }

  function openLibrary() {
    setOpen(true);
    loadMedia();
  }

  async function uploadAndSelect(files: FileList) {
    setUploading(true);
    setUploadError("");
    const fd = new FormData();
    fd.append("file", files[0]);
    try {
      const res = await fetch("/api/admin/media", { method: "POST", body: fd });
      if (res.ok) {
        const entry = await res.json();
        onChange(entry.url);
        setOpen(false);
      } else {
        const err = await res.json().catch(() => ({}));
        setUploadError(err.error || "Upload failed. Please try again.");
      }
    } catch {
      setUploadError("Upload failed. Check your connection and try again.");
    }
    setUploading(false);
    await loadMedia();
  }

  const filtered = search
    ? media.filter((m) => m.originalName.toLowerCase().includes(search.toLowerCase()))
    : media;

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Image</label>

      {/* Preview + controls */}
      <div className="flex gap-3 items-start">
        {value && (
          <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
            <img src={value} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 space-y-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://... or pick from library"
            className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={openLibrary}
            className="text-xs font-semibold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Choose from Library
          </button>
        </div>
      </div>

      {/* Library modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 flex-shrink-0">
              <h3 className="font-bold text-slate-800">Select Image</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs + search */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                {(["library", "upload"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t === "upload" ? "url" : "library")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${
                      (t === "library" && tab === "library") || (t === "upload" && tab === "url")
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {t === "library" ? "Media Library" : "Upload New"}
                  </button>
                ))}
              </div>
              {tab === "library" && (
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 border border-slate-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {tab === "library" ? (
                loadingMedia ? (
                  <div className="py-12 text-center text-slate-400 text-sm">Loading...</div>
                ) : filtered.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    {search ? "No images match your search." : "No images in library. Upload one first."}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {filtered.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => { onChange(m.url); setOpen(false); }}
                        className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                          value === m.url
                            ? "border-emerald-500 ring-2 ring-emerald-300"
                            : "border-transparent hover:border-emerald-400"
                        }`}
                      >
                        <img src={m.url} alt={m.originalName} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                        {value === m.url && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="text-white text-xs truncate">{m.originalName}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                <div
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-400 rounded-2xl p-12 text-center cursor-pointer transition-colors"
                  onClick={() => inputRef.current?.click()}
                >
                  <div className="text-4xl mb-3">📤</div>
                  <div className="text-sm font-semibold text-slate-600">
                    {uploading ? "Uploading..." : "Click to upload an image"}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">JPG, PNG, WebP, GIF — max 8 MB</div>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.length && uploadAndSelect(e.target.files)}
                  />
                </div>
                {uploadError && (
                  <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                    {uploadError}
                  </div>
                )}
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface Species {
  id: string;
  name: string;
  scientific_name: string;
  category: string;
  image: string;
  description: string;
  habitat: string;
  difficulty: "common" | "uncommon" | "rare";
}

const empty: Omit<Species, "id"> = {
  name: "",
  scientific_name: "",
  category: "bird",
  image: "",
  description: "",
  habitat: "",
  difficulty: "common",
};

const difficultyColors: Record<string, string> = {
  common: "bg-emerald-100 text-emerald-700 border-emerald-200",
  uncommon: "bg-amber-100 text-amber-700 border-amber-200",
  rare: "bg-red-100 text-red-700 border-red-200",
};

function SpeciesForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
  loading,
}: {
  initial: Omit<Species, "id">;
  onSubmit: (data: Omit<Species, "id">) => void;
  onCancel: () => void;
  submitLabel: string;
  loading: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [categories, setCategories] = useState<{ id: string; label: string; emoji: string }[]>([]);

  useEffect(() => {
    fetch("/api/admin/categories").then((r) => r.json()).then(setCategories);
  }, []);

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-5"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Common Name *
          </label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Scarlet Macaw"
            className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Scientific Name *
          </label>
          <input
            value={form.scientific_name}
            onChange={(e) => set("scientific_name", e.target.value)}
            placeholder="e.g. Ara macao"
            className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Category *
          </label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Difficulty *
          </label>
          <select
            value={form.difficulty}
            onChange={(e) => set("difficulty", e.target.value)}
            className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="common">🟢 Common</option>
            <option value="uncommon">🟡 Uncommon</option>
            <option value="rare">🔴 Rare</option>
          </select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Habitat *
          </label>
          <input
            value={form.habitat}
            onChange={(e) => set("habitat", e.target.value)}
            placeholder="e.g. River banks, forest canopy"
            className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="sm:col-span-2">
          <ImagePicker value={form.image} onChange={(url) => set("image", url)} />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Description *
          </label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Describe appearance, behavior, and interesting facts..."
            className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          {loading ? "Saving..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditModal({
  species,
  onClose,
  onSaved,
}: {
  species: Species;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(data: Omit<Species, "id">) {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/species/${species.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      onSaved();
      onClose();
    } else {
      const d = await res.json();
      setError(d.error || "Failed to save");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200">
          <h2 className="font-bold text-slate-800 text-lg">Edit Species</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          <SpeciesForm
            initial={{
              name: species.name,
              scientific_name: species.scientific_name,
              category: species.category,
              image: species.image,
              description: species.description,
              habitat: species.habitat,
              difficulty: species.difficulty,
            }}
            onSubmit={handleSubmit}
            onCancel={onClose}
            submitLabel="Save Changes"
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

export default function SpeciesManagementPage() {
  const [species, setSpecies] = useState<Species[]>([]);
  const [filtered, setFiltered] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | "common" | "uncommon" | "rare">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [editTarget, setEditTarget] = useState<Species | null>(null);
  const [categories, setCategories] = useState<{ id: string; label: string; emoji: string }[]>([]);

  const load = useCallback(async () => {
    const [specRes, catRes] = await Promise.all([
      fetch("/api/admin/species"),
      fetch("/api/admin/categories"),
    ]);
    setSpecies(await specRes.json());
    setCategories(await catRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let result = [...species];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.scientific_name.toLowerCase().includes(q) ||
          s.habitat.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all") result = result.filter((s) => s.category === categoryFilter);
    if (difficultyFilter !== "all") result = result.filter((s) => s.difficulty === difficultyFilter);
    setFiltered(result);
  }, [species, search, categoryFilter, difficultyFilter]);

  async function handleAdd(data: Omit<Species, "id">) {
    setAddLoading(true);
    setAddError("");
    setAddSuccess("");
    const res = await fetch("/api/admin/species", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setAddSuccess("Species added!");
      setShowAdd(false);
      await load();
    } else {
      const d = await res.json();
      setAddError(d.error || "Failed to add");
    }
    setAddLoading(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/species/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Species</h1>
          <p className="text-slate-500 text-sm mt-1">
            {species.length} species in the field guide
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportToCsv(species)}
            disabled={species.length === 0}
            className="bg-white border border-stone-300 hover:bg-stone-50 disabled:opacity-40 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="bg-white border border-stone-300 hover:bg-stone-50 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
            </svg>
            Import CSV
          </button>
          <button
            onClick={() => { setShowAdd(true); setAddError(""); setAddSuccess(""); }}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            + Add Species
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4">
            <h2 className="font-semibold text-emerald-900">New Species</h2>
          </div>
          <div className="p-6">
            {addError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {addError}
              </div>
            )}
            {addSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3">
                {addSuccess}
              </div>
            )}
            <SpeciesForm
              initial={empty}
              onSubmit={handleAdd}
              onCancel={() => setShowAdd(false)}
              submitLabel="Add Species"
              loading={addLoading}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, scientific name, or habitat..."
            className="flex-1 border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
            className="border border-stone-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as typeof difficultyFilter)}
            className="border border-stone-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Difficulties</option>
            <option value="common">🟢 Common</option>
            <option value="uncommon">🟡 Uncommon</option>
            <option value="rare">🔴 Rare</option>
          </select>
        </div>
        {(search || categoryFilter !== "all" || difficultyFilter !== "all") && (
          <div className="mt-2 text-xs text-slate-400">
            Showing {filtered.length} of {species.length} species
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-stone-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-sm">No species found.</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wide px-6 py-3">
                      Species
                    </th>
                    <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wide px-4 py-3">
                      Category
                    </th>
                    <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wide px-4 py-3">
                      Difficulty
                    </th>
                    <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wide px-4 py-3">
                      Habitat
                    </th>
                    <th className="text-right text-xs font-semibold text-stone-500 uppercase tracking-wide px-6 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {s.image ? (
                            <img
                              src={s.image}
                              alt={s.name}
                              className="w-10 h-10 rounded-lg object-cover bg-stone-100 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-lg flex-shrink-0">
                              {categories.find((c) => c.id === s.category)?.emoji ?? "🐾"}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-slate-800 text-sm">{s.name}</div>
                            <div className="text-xs text-slate-400 italic">{s.scientific_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-slate-600">
                          {(() => { const c = categories.find((c) => c.id === s.category); return c ? `${c.emoji} ${c.label}` : s.category; })()}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium ${difficultyColors[s.difficulty]}`}
                        >
                          {s.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        <span className="text-xs text-slate-500 line-clamp-2">{s.habitat}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditTarget(s)}
                            className="text-emerald-700 hover:text-emerald-900 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.name)}
                            className="text-red-500 hover:text-red-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
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

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-stone-100">
              {filtered.map((s) => (
                <div key={s.id} className="p-4 flex gap-3">
                  {s.image ? (
                    <img
                      src={s.image}
                      alt={s.name}
                      className="w-14 h-14 rounded-xl object-cover bg-stone-100 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-stone-100 flex items-center justify-center text-2xl flex-shrink-0">
                      {categories.find((c) => c.id === s.category)?.emoji ?? "🐾"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 text-sm">{s.name}</div>
                    <div className="text-xs text-slate-400 italic">{s.scientific_name}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${difficultyColors[s.difficulty]}`}>
                        {s.difficulty}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setEditTarget(s)}
                        className="text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        className="text-red-500 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit modal */}
      {editTarget && (
        <EditModal
          species={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={load}
        />
      )}

      {/* Import modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={load}
        />
      )}
    </div>
  );
}
