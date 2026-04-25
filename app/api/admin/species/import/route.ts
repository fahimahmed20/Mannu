import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { verifyAdminToken } from "@/lib/admin-auth";
import { logAction } from "@/lib/activity-log";

const dataPath = path.join(process.cwd(), "data", "species-data.json");

function readSpecies() {
  return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
}

function writeSpecies(data: unknown[]) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function makeId(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let actor;
  try { actor = await verifyAdminToken(token); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows: {
    name: string;
    scientific_name: string;
    category: string;
    image?: string;
    description: string;
    habitat: string;
    difficulty: string;
  }[] = await request.json();

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 400 });
  }

  const data = readSpecies();
  const existingIds = new Set(data.map((s: { id: string }) => s.id));

  const added: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const row of rows) {
    const { name, scientific_name, category, description, habitat, difficulty } = row;
    const validDifficulties = ["common", "uncommon", "rare"];
    if (!validDifficulties.includes(difficulty)) {
      errors.push(`Row "${name}" has invalid difficulty "${difficulty}"`);
      continue;
    }
    const id = makeId(name);
    if (existingIds.has(id)) {
      skipped.push(name);
      continue;
    }
    data.push({ id, name, scientific_name, category, image: row.image || "", description, habitat, difficulty });
    existingIds.add(id);
    added.push(name);
  }

  if (added.length > 0) {
    writeSpecies(data);
    logAction(actor.username, actor.role, "add_species", `Bulk imported ${added.length} species`);
  }

  return NextResponse.json({ added: added.length, skipped: skipped.length, errors });
}
