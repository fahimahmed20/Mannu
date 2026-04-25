import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "data", "species-data.json");

export async function GET() {
  const data: { id?: string; name?: string }[] = JSON.parse(
    fs.readFileSync(dataPath, "utf-8")
  );
  const valid = data.filter((s) => s.id && s.name);
  return NextResponse.json({ species: valid });
}
