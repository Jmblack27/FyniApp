import type { SQLiteDatabase } from "expo-sqlite";

import { getBalance } from "../balance/repository";
import { validateMovement } from "./rules";
import type { MovementKind, Savings, SavingsMovement } from "./types";

interface SavingsRow {
  id: number;
  name: string;
  goal: number | null;
  saved: number;
  created_at: number;
}

const SELECT_SAVINGS = `
  SELECT s.id, s.name, s.goal, s.created_at,
         COALESCE(SUM(m.amount), 0) AS saved
  FROM savings s
  LEFT JOIN savings_movements m ON m.savings_id = s.id`;

function toSavings(row: SavingsRow): Savings {
  return {
    id: row.id,
    name: row.name,
    goal: row.goal,
    saved: row.saved,
    createdAt: row.created_at,
  };
}

export async function getAllSavings(db: SQLiteDatabase): Promise<Savings[]> {
  const rows = await db.getAllAsync<SavingsRow>(
    `${SELECT_SAVINGS} GROUP BY s.id ORDER BY s.created_at ASC, s.id ASC`,
  );
  return rows.map(toSavings);
}

export async function getSavings(
  db: SQLiteDatabase,
  id: number,
): Promise<Savings | null> {
  const row = await db.getFirstAsync<SavingsRow>(
    `${SELECT_SAVINGS} WHERE s.id = ? GROUP BY s.id`,
    id,
  );
  return row ? toSavings(row) : null;
}

export async function getMovements(
  db: SQLiteDatabase,
  savingsId: number,
): Promise<SavingsMovement[]> {
  const rows = await db.getAllAsync<{ id: number; amount: number; created_at: number }>(
    `SELECT id, amount, created_at FROM savings_movements
     WHERE savings_id = ? ORDER BY created_at DESC, id DESC`,
    savingsId,
  );
  return rows.map((r) => ({ id: r.id, amount: r.amount, createdAt: r.created_at }));
}

/** Returns the new savings id. */
export async function createSavings(
  db: SQLiteDatabase,
  name: string,
  goal: number | null,
): Promise<number> {
  const now = Date.now();
  const result = await db.runAsync(
    "INSERT INTO savings (name, goal, created_at, updated_at) VALUES (?, ?, ?, ?)",
    name,
    goal,
    now,
    now,
  );
  return result.lastInsertRowId;
}

export async function updateSavings(
  db: SQLiteDatabase,
  id: number,
  name: string,
  goal: number | null,
): Promise<void> {
  await db.runAsync(
    "UPDATE savings SET name = ?, goal = ?, updated_at = ? WHERE id = ?",
    name,
    goal,
    Date.now(),
    id,
  );
}

/** Deletes the savings; its money returns to the available balance. */
export async function deleteSavings(db: SQLiteDatabase, id: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    // Explicit, so it doesn't depend on the foreign_keys pragma being on.
    await db.runAsync("DELETE FROM savings_movements WHERE savings_id = ?", id);
    await db.runAsync("DELETE FROM savings WHERE id = ?", id);
  });
}

export class MovementError extends Error {}

/**
 * Adds money to (deposit) or takes money from (withdraw) a savings.
 * Re-checks the limits against the database inside the transaction, so the
 * rules hold even if the screen's numbers were stale.
 */
export async function moveMoney(
  db: SQLiteDatabase,
  savingsId: number,
  kind: MovementKind,
  amount: number,
): Promise<void> {
  await db.withTransactionAsync(async () => {
    const [balance, savings] = await Promise.all([
      getBalance(db),
      getSavings(db, savingsId),
    ]);
    if (!savings) throw new MovementError("This savings no longer exists.");

    const problem = validateMovement(kind, amount, {
      available: balance.available,
      saved: savings.saved,
    });
    if (problem) throw new MovementError(problem);

    await db.runAsync(
      "INSERT INTO savings_movements (savings_id, amount, created_at) VALUES (?, ?, ?)",
      savingsId,
      kind === "deposit" ? amount : -amount,
      Date.now(),
    );
  });
}
