import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { verifyAdminToken } from "@/lib/admin-auth";
import { logAction } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

const configPath = path.join(process.cwd(), "data", "app-config.json");

async function getActor(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return null;
  try { return await verifyAdminToken(token); } catch { return null; }
}

export async function GET() {
  return NextResponse.json(JSON.parse(fs.readFileSync(configPath, "utf-8")));
}

export async function PUT(request: NextRequest) {
  const actor = await getActor(request);
  if (!actor || !["superadmin", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const existing = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const updated = { ...existing, ...body };
  fs.writeFileSync(configPath, JSON.stringify(updated, null, 2));
  logAction(actor.username, actor.role, "update_settings", "Updated app settings");
  return NextResponse.json(updated);
}
