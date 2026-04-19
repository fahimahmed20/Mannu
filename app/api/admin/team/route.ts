import { NextRequest, NextResponse } from "next/server";
import {
  readAdminUsers,
  writeAdminUsers,
  hashPassword,
  generateId,
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

export async function GET(request: NextRequest) {
  const actor = await getActor(request);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = readAdminUsers().map(({ passwordHash: _, salt: __, ...u }) => u);

  // Prepend the env superadmin as a virtual entry
  const superadmin = {
    id: "superadmin",
    username: process.env.ADMIN_USERNAME || "superadmin",
    email: "—",
    role: "superadmin",
    active: true,
    createdAt: "built-in",
    lastLogin: null,
  };

  return NextResponse.json([superadmin, ...users]);
}

export async function POST(request: NextRequest) {
  const actor = await getActor(request);
  if (!actor || actor.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { username, email, password, role } = await request.json();
  if (!username || !email || !password || !role) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const users = readAdminUsers();
  if (users.find((u) => u.username === username)) {
    return NextResponse.json({ error: "Username already exists" }, { status: 409 });
  }

  const { hash, salt } = hashPassword(password);
  const newUser = {
    id: generateId(),
    username,
    email,
    passwordHash: hash,
    salt,
    role: role as "admin" | "editor",
    active: true,
    createdAt: new Date().toISOString(),
    lastLogin: null,
  };

  users.push(newUser);
  writeAdminUsers(users);
  logAction(actor.username, actor.role, "create_admin", `Created admin "${username}" with role ${role}`);

  const { passwordHash: _, salt: __, ...safe } = newUser;
  return NextResponse.json(safe, { status: 201 });
}
