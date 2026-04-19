import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { verifyAdminToken } from "@/lib/admin-auth";
import { logAction } from "@/lib/activity-log";

const smtpPath = path.join(process.cwd(), "data", "smtp-config.json");

async function getActor(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return null;
  try { return await verifyAdminToken(token); } catch { return null; }
}

export async function GET(request: NextRequest) {
  const actor = await getActor(request);
  if (!actor || !["superadmin", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const config = JSON.parse(fs.readFileSync(smtpPath, "utf-8"));
  // Mask password
  return NextResponse.json({ ...config, password: config.password ? "••••••••" : "" });
}

export async function PUT(request: NextRequest) {
  const actor = await getActor(request);
  if (!actor || !["superadmin", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const existing = JSON.parse(fs.readFileSync(smtpPath, "utf-8"));

  // Keep existing password if masked placeholder sent
  const password = body.password === "••••••••" ? existing.password : body.password;
  const updated = { ...body, password };

  fs.writeFileSync(smtpPath, JSON.stringify(updated, null, 2));
  logAction(actor.username, actor.role, "update_smtp", "Updated SMTP configuration");
  return NextResponse.json({ success: true });
}

export async function POST(request: NextRequest) {
  const actor = await getActor(request);
  if (!actor || !["superadmin", "admin"].includes(actor.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { testEmail } = await request.json();
  const config = JSON.parse(fs.readFileSync(smtpPath, "utf-8"));

  if (!config.host || !config.username || !config.password) {
    return NextResponse.json({ error: "SMTP not configured" }, { status: 400 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.username, pass: config.password },
    });

    await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: testEmail,
      subject: "Manu Admin — SMTP Test",
      text: "Your SMTP configuration is working correctly.",
      html: "<p>Your <strong>SMTP configuration</strong> is working correctly. ✅</p>",
    });

    logAction(actor.username, actor.role, "test_smtp", `Test email sent to ${testEmail}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
