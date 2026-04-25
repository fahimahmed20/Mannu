import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { readAdminUsers } from "@/lib/admin-auth";
import { readLog } from "@/lib/activity-log";

const speciesPath = path.join(process.cwd(), "data", "species-data.json");
const usersPath = path.join(process.cwd(), "data", "app-users.json");

export async function GET() {
  const species = JSON.parse(fs.readFileSync(speciesPath, "utf-8"));
  const appUsers = JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  const adminUsers = readAdminUsers();
  const log = readLog().slice(0, 20);

  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const newUsersLast30 = appUsers.filter(
    (u: { joinedAt: string }) => new Date(u.joinedAt) > last30
  ).length;

  const activeUsersLast7 = appUsers.filter(
    (u: { lastSeen: string }) => new Date(u.lastSeen) > last7
  ).length;

  // User growth by month (last 6 months)
  const monthlyGrowth: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("default", { month: "short" });
    monthlyGrowth[key] = 0;
  }
  appUsers.forEach((u: { joinedAt: string }) => {
    const d = new Date(u.joinedAt);
    const key = d.toLocaleString("default", { month: "short" });
    if (key in monthlyGrowth) monthlyGrowth[key]++;
  });

  // Species by category
  const byCategory = {
    bird: species.filter((s: { category: string }) => s.category === "bird").length,
    frog: species.filter((s: { category: string }) => s.category === "frog").length,
  };

  // Species by difficulty
  const byDifficulty = {
    common: species.filter((s: { difficulty: string }) => s.difficulty === "common").length,
    uncommon: species.filter((s: { difficulty: string }) => s.difficulty === "uncommon").length,
    rare: species.filter((s: { difficulty: string }) => s.difficulty === "rare").length,
  };

  // Species seen leaderboard
  const topUsers = [...appUsers]
    .sort((a: { speciesSeen: number }, b: { speciesSeen: number }) => b.speciesSeen - a.speciesSeen)
    .slice(0, 5)
    .map((u: { email: string; speciesSeen: number }) => ({
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
      active: appUsers.filter((u: { banned: boolean }) => !u.banned).length,
      banned: appUsers.filter((u: { banned: boolean }) => u.banned).length,
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
