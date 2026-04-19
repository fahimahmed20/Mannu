import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const usersPath = path.join(process.cwd(), "data", "app-users.json");

export function readUsers() {
  return JSON.parse(fs.readFileSync(usersPath, "utf-8"));
}

export async function GET() {
  return NextResponse.json(readUsers());
}
