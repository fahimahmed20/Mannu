import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { verifyAdminToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const usersPath = path.join(process.cwd(), "data", "app-users.json");

function readUsers() {
  return JSON.parse(fs.readFileSync(usersPath, "utf-8"));
}

async function getActor(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return null;
  try { return await verifyAdminToken(token); } catch { return null; }
}

export async function GET(request: NextRequest) {
  const actor = await getActor(request);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(readUsers());
}
