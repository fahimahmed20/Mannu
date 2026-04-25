import { NextResponse } from "next/server";
import { SPECIES } from "@/data/species";

export async function GET() {
  const valid = SPECIES.filter((s) => s.id && s.name);
  return NextResponse.json({ species: valid });
}
