import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";

const logPath = path.join(process.cwd(), "data", "activity-log.json");
const MAX_ENTRIES = 500;

export interface LogEntry {
  id: string;
  admin: string;
  role: string;
  action: string;
  details: string;
  timestamp: string;
}

export function readLog(): LogEntry[] {
  try {
    return JSON.parse(fs.readFileSync(logPath, "utf-8"));
  } catch {
    return [];
  }
}

export function logAction(
  admin: string,
  role: string,
  action: string,
  details: string
) {
  const log = readLog();
  const entry: LogEntry = {
    id: randomBytes(4).toString("hex"),
    admin,
    role,
    action,
    details,
    timestamp: new Date().toISOString(),
  };
  log.unshift(entry);
  if (log.length > MAX_ENTRIES) log.splice(MAX_ENTRIES);
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
}
