import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const speciesPath = path.join(process.cwd(), "data", "species-data.json");
const categoriesPath = path.join(process.cwd(), "data", "categories.json");

export async function GET() {
  const speciesMtime = fs.statSync(speciesPath).mtimeMs;
  const categoriesMtime = fs.statSync(categoriesPath).mtimeMs;
  const version = Math.max(speciesMtime, categoriesMtime).toString();
  return NextResponse.json({ version });
}
