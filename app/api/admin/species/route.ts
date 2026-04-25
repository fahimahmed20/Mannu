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

async function getActor(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return null;
  try { return await verifyAdminToken(token); } catch { return null; }
}

export async function GET() {
  return NextResponse.json(readSpecies());
}

export async function POST(request: NextRequest) {
  const actor = await getActor(request);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, scientific_name, category, image, description, habitat, difficulty } = body;

  if (!scientific_name || !scientific_name.trim()) {
    return NextResponse.json({ error: "Scientific name is required" }, { status: 400 });
  }

  const idSource = (name && name.trim()) ? name.trim() : scientific_name.trim();
  const id = idSource.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const data = readSpecies();

  if (data.find((s: { id: string }) => s.id === id)) {
    return NextResponse.json({ error: "A species with this name already exists" }, { status: 409 });
  }

  const newSpecies = { id, name, scientific_name, category, image, description, habitat, difficulty };
  data.push(newSpecies);
  writeSpecies(data);

  logAction(actor.username, actor.role, "add_species", `Added species: ${name}`);
  return NextResponse.json(newSpecies, { status: 201 });
}
