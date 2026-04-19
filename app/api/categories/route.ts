import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const catPath = path.join(process.cwd(), "data", "categories.json");

export async function GET() {
  const data = JSON.parse(fs.readFileSync(catPath, "utf-8"));
  return NextResponse.json(data);
}
