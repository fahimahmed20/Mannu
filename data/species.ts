import speciesData from "./species-data.json";
import categoriesData from "./categories.json";
import { getPalette, type CategoryDef } from "@/lib/category-palettes";

export type Category = string;

export interface Species {
  id: string;
  name: string;
  scientific_name: string;
  category: Category;
  image: string;
  description: string;
  habitat: string;
  difficulty: "common" | "uncommon" | "rare";
}

export const SPECIES: Species[] = speciesData as Species[];

export const CATEGORIES: (CategoryDef & {
  color: string;
  bgLight: string;
  textColor: string;
  borderColor: string;
})[] = (categoriesData as CategoryDef[]).map((c) => {
  const p = getPalette(c.paletteId);
  return {
    ...c,
    color: `linear-gradient(135deg, ${p.from}, ${p.to})`,
    bgLight: p.light,
    textColor: p.text,
    borderColor: p.border,
  };
});

export function getSpeciesById(id: string): Species | undefined {
  return SPECIES.find((s) => s.id === id);
}

export function getSpeciesByCategory(category: Category): Species[] {
  return SPECIES.filter((s) => s.category === category);
}
