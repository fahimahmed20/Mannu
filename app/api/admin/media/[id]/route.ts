import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { verifyAdminToken } from "@/lib/admin-auth";
import { logAction } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

const mediaPath = path.join(process.cwd(), "data", "media.json");
const uploadsDir = path.join(process.cwd(), "public", "uploads");

async function getActor(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return null;
  try { return await verifyAdminToken(token); } catch { return null; }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getActor(request);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const media = fs.existsSync(mediaPath)
    ? JSON.parse(fs.readFileSync(mediaPath, "utf-8"))
    : [];
  const entry = media.find((m: { id: string }) => m.id === id);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete physical file
  const filePath = path.join(uploadsDir, entry.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  fs.writeFileSync(mediaPath, JSON.stringify(media.filter((m: { id: string }) => m.id !== id), null, 2));
  logAction(actor.username, actor.role, "delete_media", `Deleted image: ${entry.originalName}`);
  return NextResponse.json({ success: true });
}
