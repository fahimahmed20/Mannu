import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { verifyUserToken } from "@/lib/user-auth";

const usersPath = path.join(process.cwd(), "data", "app-users.json");

export async function GET(request: NextRequest) {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = auth.slice(7);
    const payload = await verifyUserToken(token);

    const users: { id: string; email: string; banned: boolean }[] = JSON.parse(
      fs.readFileSync(usersPath, "utf-8")
    );
    const user = users.find((u) => u.id === payload.id);

    if (!user || user.banned) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ user: { id: user.id, email: user.email } });
  } catch {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
  }
}
