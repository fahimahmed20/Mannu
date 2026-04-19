import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json(null, { status: 401 });
  try {
    const payload = await verifyAdminToken(token);
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(null, { status: 401 });
  }
}
