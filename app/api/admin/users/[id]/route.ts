import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { verifyAdminToken } from "@/lib/admin-auth";
import { logAction } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

const usersPath = path.join(process.cwd(), "data", "app-users.json");

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
  const users = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  const idx = users.findIndex((u: { id: string }) => u.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  users[idx] = { ...users[idx], ...body };
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));

  const action = body.banned ? "banned_user" : "unbanned_user";
  logAction(actor.username, actor.role, action, `${actor.username} updated user "${users[idx].email}"`);
  return NextResponse.json(users[idx]);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getActor(request);
  if (!actor || !["superadmin", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const users = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  const target = users.find((u: { id: string }) => u.id === id);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  fs.writeFileSync(usersPath, JSON.stringify(users.filter((u: { id: string }) => u.id !== id), null, 2));
  logAction(actor.username, actor.role, "delete_user", `Deleted app user "${target.email}"`);
  return NextResponse.json({ success: true });
}
