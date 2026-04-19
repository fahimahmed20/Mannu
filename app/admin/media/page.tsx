"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface MediaEntry {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<MediaEntry | null>(null);
  const [dragging, setDragging] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/media");
    setMedia(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function uploadFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    if (!arr.length) return;
    setUploading(true);
    setUploadError("");

    for (const file of arr) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/media", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json();
        setUploadError(d.error || "Upload failed");
      }
    }

    await load();
    setUploading(false);
  }

  async function handleDelete(entry: MediaEntry) {
    if (!confirm(`Delete "${entry.originalName}"?`)) return;
    await fetch(`/api/admin/media/${entry.id}`, { method: "DELETE" });
    setPreview(null);
    await load();
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(window.location.origin + url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  }

  const filtered = search
    ? media.filter((m) => m.originalName.toLowerCase().includes(search.toLowerCase()))
    : media;

  const totalSize = media.reduce((a, m) => a + m.size, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Media Library</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {media.length} files · {fmtSize(totalSize)} total
          </p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {uploading ? "Uploading..." : "Upload Images"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
          dragging
            ? "border-emerald-500 bg-emerald-50"
            : "border-slate-300 hover:border-emerald-400 hover:bg-slate-50"
        }`}
      >
        <div className="text-3xl mb-3">{dragging ? "📂" : "🖼️"}</div>
        <div className="text-sm font-semibold text-slate-600">
          {dragging ? "Drop to upload" : "Drag & drop images here, or click to browse"}
        </div>
        <div className="text-xs text-slate-400 mt-1">JPG, PNG, WebP, GIF, SVG — max 8 MB each</div>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{uploadError}</div>
      )}

      {/* Search */}
      {media.length > 0 && (
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search images..."
            className="flex-1 max-w-xs border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {search && (
            <span className="text-sm text-slate-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading media...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          {search ? "No images match your search." : "No images uploaded yet. Upload your first image above."}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9 gap-4">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => setPreview(m)}
            >
              <div className="aspect-square bg-slate-100 overflow-hidden">
                <img
                  src={m.url}
                  alt={m.originalName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-2">
                <div className="text-xs font-medium text-slate-700 truncate">{m.originalName}</div>
                <div className="text-xs text-slate-400 mt-0.5">{fmtSize(m.size)}</div>
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-2xl" />
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPreview(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            {/* Image */}
            <div className="bg-slate-900 flex items-center justify-center min-h-48 max-h-96 overflow-hidden">
              <img
                src={preview.url}
                alt={preview.originalName}
                className="max-w-full max-h-96 object-contain"
              />
            </div>
            {/* Info */}
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">{preview.originalName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {fmtSize(preview.size)} · {preview.type} · Uploaded {fmtDate(preview.uploadedAt)} by {preview.uploadedBy}
                  </p>
                </div>
                <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* URL bar */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <span className="text-xs text-slate-500 flex-1 truncate font-mono">{preview.url}</span>
                <button
                  onClick={() => copyUrl(preview.url)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 ${
                    copied === preview.url
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                  }`}
                >
                  {copied === preview.url ? "Copied!" : "Copy URL"}
                </button>
              </div>

              <div className="flex gap-2">
                <a
                  href={preview.url}
                  download={preview.originalName}
                  className="flex-1 text-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Download
                </a>
                <button
                  onClick={() => handleDelete(preview)}
                  className="flex-1 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold rounded-xl transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
