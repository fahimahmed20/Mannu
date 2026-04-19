import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { verifyAdminToken } from "@/lib/admin-auth";
import { logAction } from "@/lib/activity-log";

const mediaPath = path.join(process.cwd(), "data", "media.json");
const uploadsDir = path.join(process.cwd(), "public", "uploads");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB

function readMedia() {
  return JSON.parse(fs.readFileSync(mediaPath, "utf-8"));
}

async function getActor(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return null;
  try { return await verifyAdminToken(token); } catch { return null; }
}

export async function GET(request: NextRequest) {
  const actor = await getActor(request);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(readMedia());
}

export async function POST(request: NextRequest) {
  const actor = await getActor(request);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed. Use JPG, PNG, WebP, GIF, or SVG." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large. Maximum size is 8 MB." }, { status: 400 });
  }

  const ext = path.extname(file.name).toLowerCase() || ".jpg";
  const id = randomBytes(8).toString("hex");
  const filename = `${id}${ext}`;
  const filePath = path.join(uploadsDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  const entry = {
    id,
    filename,
    originalName: file.name,
    url: `/uploads/${filename}`,
    size: file.size,
    type: file.type,
    uploadedAt: new Date().toISOString(),
    uploadedBy: actor.username,
  };

  const media = readMedia();
  media.unshift(entry);
  fs.writeFileSync(mediaPath, JSON.stringify(media, null, 2));

  logAction(actor.username, actor.role, "upload_media", `Uploaded image: ${file.name}`);
  return NextResponse.json(entry, { status: 201 });
}
