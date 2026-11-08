import type { SQLiteDatabase } from "expo-sqlite";

import type { MonthRange } from "../../utils/month";
import type { Budget } from "./types";

export async function getBudgets(db: SQLiteDatabase): Promise<Budget[]> {
  return db.getAllAsync<Budget>("SELECT category, amount FROM budgets");
}

export async function getBudget(
  db: SQLiteDatabase,
  category: string,
): Promise<Budget | null> {
  return db.getFirstAsync<Budget>(
    "SELECT category, amount FROM budgets WHERE category = ?",
    category,
  );
}

/** Insert or replace the monthly limit for a category. */
export async function setBudget(
  db: SQLiteDatabase,
  category: string,
  amount: number,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO budgets (category, amount, updated_at) VALUES (?, ?, ?)
     ON CONFLICT (category) DO UPDATE SET
       amount = excluded.amount,
       updated_at = excluded.updated_at`,
    category,
    amount,
    Date.now(),
  );
}

export async function deleteBudget(
  db: SQLiteDatabase,
  category: string,
): Promise<void> {
  await db.runAsync("DELETE FROM budgets WHERE category = ?", category);
}

/** Expense totals per category within [range.start, range.end). */
export async function getExpensesByCategory(
  db: SQLiteDatabase,
  range: MonthRange,
): Promise<Map<string, number>> {
  const rows = await db.getAllAsync<{ category: string; spent: number }>(
    `SELECT category, SUM(amount) AS spent
     FROM transactions
     WHERE type = 'EXPENSE' AND created_at >= ? AND created_at < ?
     GROUP BY category`,
    range.start,
    range.end,
  );
  return new Map(rows.map((r) => [r.category, r.spent]));
}
