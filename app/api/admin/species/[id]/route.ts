import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { verifyAdminToken } from "@/lib/admin-auth";
import { logAction } from "@/lib/activity-log";

const dataPath = path.join(process.cwd(), "data", "species-data.json");

function read() { return JSON.parse(fs.readFileSync(dataPath, "utf-8")); }
function write(data: unknown[]) { fs.writeFileSync(dataPath, JSON.stringify(data, null, 2)); }

async function getActor(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return null;
  try { return await verifyAdminToken(token); } catch { return null; }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getActor(request);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const data = read();
  const idx = data.findIndex((s: { id: string }) => s.id === id);

  if (idx === -1) return NextResponse.json({ error: "Species not found" }, { status: 404 });

  data[idx] = { ...data[idx], ...body, id };
  write(data);

  logAction(actor.username, actor.role, "edit_species", `Updated species: ${data[idx].name}`);
  return NextResponse.json(data[idx]);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getActor(request);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const data = read();
  const target = data.find((s: { id: string }) => s.id === id);
  if (!target) return NextResponse.json({ error: "Species not found" }, { status: 404 });

  write(data.filter((s: { id: string }) => s.id !== id));
  logAction(actor.username, actor.role, "delete_species", `Deleted species: ${target.name}`);
  return NextResponse.json({ success: true });
}
