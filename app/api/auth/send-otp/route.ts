import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { generateOTP, saveOTP } from "@/lib/user-auth";

const usersPath = path.join(process.cwd(), "data", "app-users.json");
const configPath = path.join(process.cwd(), "data", "app-config.json");
const smtpPath = path.join(process.cwd(), "data", "smtp-config.json");

interface AppUser {
  id: string;
  email: string;
  active: boolean;
  banned: boolean;
  joinedAt: string;
  lastSeen: string;
  speciesSeen: number;
  role: string;
}

function readUsers(): AppUser[] {
  return JSON.parse(fs.readFileSync(usersPath, "utf-8"));
}

function writeUsers(users: AppUser[]) {
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email: string = (body.email || "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const smtp = JSON.parse(fs.readFileSync(smtpPath, "utf-8"));

    // Find or create user
    const users = readUsers();
    let user = users.find((u) => u.email === email);

    if (!user) {
      if (config.maintenanceMode) {
        return NextResponse.json({ error: "The app is in maintenance mode. Try again later." }, { status: 503 });
      }
      if (!config.allowRegistration) {
        return NextResponse.json({ error: "New registrations are currently disabled." }, { status: 403 });
      }
      user = {
        id: `usr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        email,
        active: true,
        banned: false,
        joinedAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        speciesSeen: 0,
        role: "user",
      };
      users.push(user);
      writeUsers(users);
    }

    if (user.banned) {
      return NextResponse.json({ error: "This account has been suspended." }, { status: 403 });
    }

    if (config.maintenanceMode) {
      return NextResponse.json({ error: "The app is in maintenance mode. Try again later." }, { status: 503 });
    }

    const code = generateOTP();
    const expiryMinutes: number = config.otpExpiryMinutes || 10;
    saveOTP(email, code, expiryMinutes);

    const smtpReady = smtp.host && smtp.username && smtp.password;

    if (smtpReady) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtp.host,
          port: Number(smtp.port) || 587,
          secure: Boolean(smtp.secure),
          auth: { user: smtp.username, pass: smtp.password },
        });

        await transporter.sendMail({
          from: `"${smtp.fromName || "Manu Explorers"}" <${smtp.fromEmail || smtp.username}>`,
          to: email,
          subject: "Your Manu Explorers sign-in code",
          text: `Your verification code is: ${code}\n\nThis code expires in ${expiryMinutes} minutes.\n\nIf you did not request this, ignore this email.`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
              <div style="background:linear-gradient(135deg,#059669,#0f766e);padding:32px 24px;text-align:center;">
                <div style="font-size:40px;margin-bottom:8px;">🦜</div>
                <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">Manu Explorers</h1>
                <p style="color:#a7f3d0;margin:6px 0 0;font-size:13px;">Field Guide · Manu National Park, Peru</p>
              </div>
              <div style="background:#f9fafb;padding:32px 24px;">
                <p style="color:#374151;font-size:15px;margin:0 0 20px;">Here is your sign-in verification code:</p>
                <div style="background:white;border:2px solid #d1fae5;border-radius:12px;padding:28px;text-align:center;">
                  <span style="font-size:44px;font-weight:800;letter-spacing:0.35em;color:#065f46;font-family:monospace;">${code}</span>
                </div>
                <p style="color:#6b7280;font-size:13px;margin:20px 0 0;">
                  This code expires in <strong>${expiryMinutes} minutes</strong>.
                </p>
                <p style="color:#9ca3af;font-size:12px;margin:12px 0 0;">
                  If you did not request this, you can safely ignore this email.
                </p>
              </div>
            </div>
          `,
        });

        return NextResponse.json({ message: "Verification code sent to your email." });
      } catch (err) {
        console.error("SMTP send error:", err);
        return NextResponse.json(
          { error: "Failed to send email. Please try again or contact support." },
          { status: 500 }
        );
      }
    }

    // Dev mode — return code in response when SMTP is not set up
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({
        message: "Dev mode — SMTP not configured. Use the code shown below.",
        otp_code: code,
      });
    }

    return NextResponse.json(
      { error: "Email service is not configured. Please contact the administrator." },
      { status: 500 }
    );
  } catch (err) {
    console.error("send-otp error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
