import type { SQLiteDatabase } from "expo-sqlite";

export const DATABASE_NAME = "fyni.db";

const DATABASE_VERSION = 2;

/**
 * Runs on app start via <SQLiteProvider onInit>. Uses PRAGMA user_version to
 * track which migrations have been applied. To change the schema, add a new
 * `if (version < N)` block and bump DATABASE_VERSION; never edit old blocks.
 */
export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  let version = row?.user_version ?? 0;

  if (version >= DATABASE_VERSION) return;

  if (version < 1) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        amount INTEGER NOT NULL CHECK (amount > 0),
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_transactions_created_at
        ON transactions (created_at DESC);
    `);
    version = 1;
  }

  if (version < 2) {
    // One recurring monthly limit per expense category id (see categories.ts).
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS budgets (
        category TEXT PRIMARY KEY NOT NULL,
        amount INTEGER NOT NULL CHECK (amount > 0),
        updated_at INTEGER NOT NULL
      );
    `);
    version = 2;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
