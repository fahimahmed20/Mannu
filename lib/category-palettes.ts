export interface Palette {
  from: string;
  to: string;
  light: string;
  text: string;
  border: string;
  label: string;
  preview: string; // solid color for swatches
}

export const PALETTES: Record<string, Palette> = {
  emerald:  { from: "#059669", to: "#0f766e", light: "#ecfdf5", text: "#047857", border: "#a7f3d0", label: "Emerald",  preview: "#059669" },
  lime:     { from: "#65a30d", to: "#15803d", light: "#f7fee7", text: "#4d7c0f", border: "#bef264", label: "Lime",     preview: "#65a30d" },
  teal:     { from: "#0d9488", to: "#0e7490", light: "#f0fdfa", text: "#0f766e", border: "#99f6e4", label: "Teal",     preview: "#0d9488" },
  blue:     { from: "#2563eb", to: "#4338ca", light: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", label: "Blue",     preview: "#2563eb" },
  indigo:   { from: "#6366f1", to: "#4338ca", light: "#eef2ff", text: "#4338ca", border: "#c7d2fe", label: "Indigo",   preview: "#6366f1" },
  purple:   { from: "#9333ea", to: "#7c3aed", light: "#faf5ff", text: "#7e22ce", border: "#e9d5ff", label: "Purple",   preview: "#9333ea" },
  pink:     { from: "#ec4899", to: "#e11d48", light: "#fdf2f8", text: "#be185d", border: "#fbcfe8", label: "Pink",     preview: "#ec4899" },
  red:      { from: "#ef4444", to: "#be123c", light: "#fef2f2", text: "#b91c1c", border: "#fecaca", label: "Red",      preview: "#ef4444" },
  orange:   { from: "#f97316", to: "#dc2626", light: "#fff7ed", text: "#c2410c", border: "#fed7aa", label: "Orange",   preview: "#f97316" },
  amber:    { from: "#f59e0b", to: "#ea580c", light: "#fffbeb", text: "#b45309", border: "#fde68a", label: "Amber",    preview: "#f59e0b" },
  slate:    { from: "#475569", to: "#1e293b", light: "#f8fafc", text: "#334155", border: "#cbd5e1", label: "Slate",    preview: "#475569" },
  cyan:     { from: "#06b6d4", to: "#0e7490", light: "#ecfeff", text: "#0e7490", border: "#a5f3fc", label: "Cyan",     preview: "#06b6d4" },
};

export type PaletteId = keyof typeof PALETTES;

export function getPalette(id: string): Palette {
  return PALETTES[id] ?? PALETTES.emerald;
}

export interface CategoryDef {
  id: string;
  label: string;
  emoji: string;
  paletteId: string;
}
