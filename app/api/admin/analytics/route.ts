import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { readAdminUsers, verifyAdminToken } from "@/lib/admin-auth";
import { readLog } from "@/lib/activity-log";

export const dynamic = "force-dynamic";

const speciesPath = path.join(process.cwd(), "data", "species-data.json");
const usersPath = path.join(process.cwd(), "data", "app-users.json");

function readJson(p: string, fallback: unknown) {
  try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return fallback; }
}

async function getActor(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return null;
  try { return await verifyAdminToken(token); } catch { return null; }
}

export async function GET(request: NextRequest) {
  const actor = await getActor(request);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const species = readJson(speciesPath, []) as { category: string; difficulty: string }[];
  const appUsers = readJson(usersPath, []) as { joinedAt: string; lastSeen: string; banned: boolean; speciesSeen: number; email: string }[];
  const adminUsers = readAdminUsers();
  const log = readLog().slice(0, 20);

  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const newUsersLast30 = appUsers.filter(
    (u) => new Date(u.joinedAt) > last30
  ).length;

  const activeUsersLast7 = appUsers.filter(
    (u) => new Date(u.lastSeen) > last7
  ).length;

  // User growth by month (last 6 months)
  const monthlyGrowth: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("default", { month: "short" });
    monthlyGrowth[key] = 0;
  }
  appUsers.forEach((u) => {
    const d = new Date(u.joinedAt);
    const key = d.toLocaleString("default", { month: "short" });
    if (key in monthlyGrowth) monthlyGrowth[key]++;
  });

  // Species by category
  const byCategory = {
    bird: species.filter((s) => s.category === "bird").length,
    frog: species.filter((s) => s.category === "frog").length,
  };

  // Species by difficulty
  const byDifficulty = {
    common: species.filter((s) => s.difficulty === "common").length,
    uncommon: species.filter((s) => s.difficulty === "uncommon").length,
    rare: species.filter((s) => s.difficulty === "rare").length,
  };

  // Species seen leaderboard
  const topUsers = [...appUsers]
    .sort((a, b) => b.speciesSeen - a.speciesSeen)
    .slice(0, 5)
    .map((u) => ({
      email: u.email,
      speciesSeen: u.speciesSeen,
    }));

  return NextResponse.json({
    species: {
      total: species.length,
      byCategory,
      byDifficulty,
    },
    users: {
      total: appUsers.length,
      active: appUsers.filter((u) => !u.banned).length,
      banned: appUsers.filter((u) => u.banned).length,
      newLast30: newUsersLast30,
      activeLast7: activeUsersLast7,
      monthlyGrowth,
      topUsers,
    },
    team: {
      total: adminUsers.length + 1, // +1 for env superadmin
      active: adminUsers.filter((u: { active: boolean }) => u.active).length + 1,
    },
    recentActivity: log,
  });
}
