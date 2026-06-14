import type { SQLiteDatabase } from "expo-sqlite";
import type { Result } from "../types";

export interface GrimoireReading {
  id: number;
  mode: string;
  timestamp: number;
  cards_json: string;
  spread_name: string | null;
  user_note: string | null;
}

export async function migrateDb(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const version = row?.user_version ?? 0;

  if (version < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS readings (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        mode        TEXT    NOT NULL,
        timestamp   INTEGER NOT NULL,
        cards_json  TEXT    NOT NULL,
        spread_name TEXT,
        user_note   TEXT
      );
    `);
    await db.runAsync("PRAGMA user_version = 1");
  }
}

export function saveReading(
  db: SQLiteDatabase,
  mode: string,
  result: Result,
  spreadName?: string,
): void {
  db.runAsync(
    "INSERT INTO readings (mode, timestamp, cards_json, spread_name) VALUES (?, ?, ?, ?)",
    [mode, Date.now(), JSON.stringify(result), spreadName ?? null],
  ).catch(console.error);
}

export async function getReadings(db: SQLiteDatabase): Promise<GrimoireReading[]> {
  return db.getAllAsync<GrimoireReading>(
    "SELECT * FROM readings ORDER BY timestamp DESC",
  );
}

export async function updateNote(db: SQLiteDatabase, id: number, note: string): Promise<void> {
  await db.runAsync("UPDATE readings SET user_note = ? WHERE id = ?", [note, id]);
}

export async function deleteReading(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync("DELETE FROM readings WHERE id = ?", [id]);
}
