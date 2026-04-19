import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes } from "crypto";
import fs from "fs";
import path from "path";

const secret = () =>
  new TextEncoder().encode(
    process.env.ADMIN_JWT_SECRET || "fallback-secret-change-me"
  );

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: "superadmin" | "admin" | "editor";
  active: boolean;
  createdAt: string;
  lastLogin: string | null;
}

const adminUsersPath = path.join(process.cwd(), "data", "admin-users.json");

export function readAdminUsers(): AdminUser[] {
  return JSON.parse(fs.readFileSync(adminUsersPath, "utf-8"));
}

export function writeAdminUsers(users: AdminUser[]) {
  fs.writeFileSync(adminUsersPath, JSON.stringify(users, null, 2));
}

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(salt + password).digest("hex");
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  return createHash("sha256").update(salt + password).digest("hex") === hash;
}

export function generateId(): string {
  return randomBytes(8).toString("hex");
}

export function checkAdminCredentials(
  username: string,
  password: string
): { valid: boolean; role: "superadmin" | "admin" | "editor"; email: string; id: string } | null {
  // Check env superadmin first
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    return { valid: true, role: "superadmin", email: "", id: "superadmin" };
  }

  // Check JSON admin users
  const users = readAdminUsers();
  const user = users.find((u) => u.username === username && u.active);
  if (user && verifyPassword(password, user.passwordHash, user.salt)) {
    // Update last login
    user.lastLogin = new Date().toISOString();
    writeAdminUsers(users);
    return { valid: true, role: user.role, email: user.email, id: user.id };
  }

  return null;
}

export async function signAdminToken(payload: {
  username: string;
  role: string;
  id: string;
  email: string;
}) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
}

export async function verifyAdminToken(token: string) {
  const { payload } = await jwtVerify(token, secret());
  return payload as {
    username: string;
    role: string;
    id: string;
    email: string;
  };
}
