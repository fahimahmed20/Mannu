import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { verifyAdminToken } from "@/lib/admin-auth";
import { logAction } from "@/lib/activity-log";

const catPath = path.join(process.cwd(), "data", "categories.json");
const speciesPath = path.join(process.cwd(), "data", "species-data.json");

function readCats() { return JSON.parse(fs.readFileSync(catPath, "utf-8")); }
function writeCats(d: unknown[]) { fs.writeFileSync(catPath, JSON.stringify(d, null, 2)); }

async function getActor(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return null;
  try { return await verifyAdminToken(token); } catch { return null; }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const cats = readCats();
  const idx = cats.findIndex((c: { id: string }) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  cats[idx] = { ...cats[idx], ...body, id }; // id is immutable
  writeCats(cats);
  logAction(actor.username, actor.role, "edit_category", `Updated category: ${cats[idx].label}`);
  return NextResponse.json(cats[idx]);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getActor(req);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Check if any species use this category
  const species = JSON.parse(fs.readFileSync(speciesPath, "utf-8"));
  const inUse = species.filter((s: { category: string }) => s.category === id).length;
  if (inUse > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${inUse} species still use this category. Reassign them first.` },
      { status: 409 }
    );
  }

  const cats = readCats();
  const target = cats.find((c: { id: string }) => c.id === id);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  writeCats(cats.filter((c: { id: string }) => c.id !== id));
  logAction(actor.username, actor.role, "delete_category", `Deleted category: ${target.label}`);
  return NextResponse.json({ success: true });
}
