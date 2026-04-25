import { SignJWT, jwtVerify } from "jose";
import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";

const secret = () =>
  new TextEncoder().encode(
    process.env.USER_JWT_SECRET || "user-jwt-secret-change-in-production"
  );

export async function signUserToken(
  payload: { id: string; email: string },
  expiryHours: number
) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiryHours}h`)
    .sign(secret());
}

export async function verifyUserToken(token: string) {
  const { payload } = await jwtVerify(token, secret());
  return payload as { id: string; email: string };
}

export function generateOTP(): string {
  const num = randomBytes(4).readUInt32BE(0) % 1000000;
  return num.toString().padStart(6, "0");
}

// ── OTP store (file-backed) ────────────────────────────────────────

const otpStorePath = path.join(process.cwd(), "data", "otp-store.json");

interface OTPEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

function readOtpStore(): Record<string, OTPEntry> {
  try {
    return JSON.parse(fs.readFileSync(otpStorePath, "utf-8"));
  } catch {
    return {};
  }
}

function writeOtpStore(store: Record<string, OTPEntry>) {
  fs.writeFileSync(otpStorePath, JSON.stringify(store, null, 2));
}

export function saveOTP(email: string, code: string, expiryMinutes: number) {
  const store = readOtpStore();
  const now = Date.now();
  // Prune expired entries
  for (const key of Object.keys(store)) {
    if (store[key].expiresAt < now) delete store[key];
  }
  store[email] = {
    code,
    expiresAt: now + expiryMinutes * 60 * 1000,
    attempts: 0,
  };
  writeOtpStore(store);
}

export function consumeOTP(
  email: string,
  code: string
): { valid: boolean; error?: string } {
  const store = readOtpStore();
  const entry = store[email];

  if (!entry) {
    return { valid: false, error: "No code found. Please request a new one." };
  }
  if (Date.now() > entry.expiresAt) {
    delete store[email];
    writeOtpStore(store);
    return { valid: false, error: "Code expired. Please request a new one." };
  }
  if (entry.attempts >= 5) {
    delete store[email];
    writeOtpStore(store);
    return { valid: false, error: "Too many attempts. Please request a new code." };
  }
  if (entry.code !== code) {
    entry.attempts += 1;
    writeOtpStore(store);
    const left = 5 - entry.attempts;
    return {
      valid: false,
      error: `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} remaining.`,
    };
  }

  delete store[email];
  writeOtpStore(store);
  return { valid: true };
}
