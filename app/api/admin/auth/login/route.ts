import { NextResponse } from "next/server";
import { checkAdminCredentials, signAdminToken } from "@/lib/admin-auth";
import { logAction } from "@/lib/activity-log";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  const result = checkAdminCredentials(username, password);
  if (!result) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signAdminToken({
    username,
    role: result.role,
    id: result.id,
    email: result.email,
  });

  logAction(username, result.role, "login", `Admin "${username}" signed in`);

  const res = NextResponse.json({ success: true, role: result.role });
  res.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  return res;
}
