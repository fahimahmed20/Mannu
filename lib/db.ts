import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "manu-explorers";
const DB_VERSION = 1;
const STORE_CHECKLIST = "checklist";
const STORE_USER = "user";

export interface ChecklistEntry {
  species_id: string;
  seen: boolean;
  timestamp: number;
}

export interface UserData {
  id: string;
  email?: string;
  token?: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_CHECKLIST)) {
          db.createObjectStore(STORE_CHECKLIST, { keyPath: "species_id" });
        }
        if (!db.objectStoreNames.contains(STORE_USER)) {
          db.createObjectStore(STORE_USER, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllChecklist(): Promise<ChecklistEntry[]> {
  const db = await getDB();
  return db.getAll(STORE_CHECKLIST);
}

export async function getChecklistEntry(speciesId: string): Promise<ChecklistEntry | undefined> {
  const db = await getDB();
  return db.get(STORE_CHECKLIST, speciesId);
}

export async function updateSeen(speciesId: string, seen: boolean): Promise<void> {
  const db = await getDB();
  const entry: ChecklistEntry = {
    species_id: speciesId,
    seen,
    timestamp: Date.now(),
  };
  await db.put(STORE_CHECKLIST, entry);
}

export async function clearChecklist(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_CHECKLIST);
}

export async function mergeChecklist(remote: ChecklistEntry[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_CHECKLIST, "readwrite");
  for (const entry of remote) {
    const existing = await tx.store.get(entry.species_id);
    // Keep whichever was updated more recently
    if (!existing || entry.timestamp > existing.timestamp) {
      await tx.store.put(entry);
    }
  }
  await tx.done;
}

export async function getUser(): Promise<UserData | undefined> {
  const db = await getDB();
  const all = await db.getAll(STORE_USER);
  return all[0];
}

export async function saveUser(user: UserData): Promise<void> {
  const db = await getDB();
  await db.put(STORE_USER, user);
}

export async function clearUser(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_USER);
}
