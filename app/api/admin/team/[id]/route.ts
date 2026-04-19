import { NextRequest, NextResponse } from "next/server";
import {
  readAdminUsers,
  writeAdminUsers,
  hashPassword,
  verifyAdminToken,
} from "@/lib/admin-auth";
import { logAction } from "@/lib/activity-log";

async function getActor(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return null;
  try {
    return await verifyAdminToken(token);
  } catch {
    return null;
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getActor(request);
  if (!actor || actor.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (id === "superadmin") {
    return NextResponse.json({ error: "Cannot edit built-in superadmin" }, { status: 403 });
  }

  const body = await request.json();
  const users = readAdminUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.role) users[idx].role = body.role;
  if (typeof body.active === "boolean") users[idx].active = body.active;
  if (body.email) users[idx].email = body.email;
  if (body.password) {
    const { hash, salt } = hashPassword(body.password);
    users[idx].passwordHash = hash;
    users[idx].salt = salt;
  }

  writeAdminUsers(users);
  logAction(actor.username, actor.role, "update_admin", `Updated admin "${users[idx].username}"`);

  const { passwordHash: _, salt: __, ...safe } = users[idx];
  return NextResponse.json(safe);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getActor(request);
  if (!actor || actor.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (id === "superadmin") {
    return NextResponse.json({ error: "Cannot delete built-in superadmin" }, { status: 403 });
  }

  const users = readAdminUsers();
  const target = users.find((u) => u.id === id);
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  writeAdminUsers(users.filter((u) => u.id !== id));
  logAction(actor.username, actor.role, "delete_admin", `Deleted admin "${target.username}"`);
  return NextResponse.json({ success: true });
}
