import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { verifyAdminToken } from "@/lib/admin-auth";
import { logAction } from "@/lib/activity-log";

const catPath = path.join(process.cwd(), "data", "categories.json");
const speciesPath = path.join(process.cwd(), "data", "species-data.json");

function read() { return JSON.parse(fs.readFileSync(catPath, "utf-8")); }
function write(d: unknown[]) { fs.writeFileSync(catPath, JSON.stringify(d, null, 2)); }

async function getActor(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return null;
  try { return await verifyAdminToken(token); } catch { return null; }
}

export async function GET() {
  return NextResponse.json(read());
}

export async function POST(req: NextRequest) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, label, emoji, paletteId } = await req.json();
  if (!id || !label || !emoji || !paletteId) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const slugId = id.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const cats = read();

  if (cats.find((c: { id: string }) => c.id === slugId)) {
    return NextResponse.json({ error: "Category ID already exists" }, { status: 409 });
  }

  const entry = { id: slugId, label, emoji, paletteId };
  cats.push(entry);
  write(cats);
  logAction(actor.username, actor.role, "add_category", `Added category: ${label}`);
  return NextResponse.json(entry, { status: 201 });
}
