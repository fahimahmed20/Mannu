import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { consumeOTP, signUserToken } from "@/lib/user-auth";

const usersPath = path.join(process.cwd(), "data", "app-users.json");
const configPath = path.join(process.cwd(), "data", "app-config.json");

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
    const code: string = (body.code || "").trim();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
    }

    const result = consumeOTP(email, code);
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const users = readUsers();
    const user = users.find((u) => u.email === email);

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.banned) {
      return NextResponse.json({ error: "This account has been suspended." }, { status: 403 });
    }

    user.lastSeen = new Date().toISOString();
    user.active = true;
    writeUsers(users);

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const sessionHours: number = config.sessionHours || 168;
    const token = await signUserToken({ id: user.id, email: user.email }, sessionHours);

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
