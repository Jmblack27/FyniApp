import type { SQLiteDatabase } from "expo-sqlite";

import { getSummary } from "../transactions/repository";

export interface BalanceBreakdown {
  income: number;
  expenses: number;
  /** Money currently held in savings */
  saved: number;
  /** What the user can spend: income - expenses - saved */
  available: number;
}

export async function getTotalSaved(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ saved: number }>(
    "SELECT COALESCE(SUM(amount), 0) AS saved FROM savings_movements",
  );
  return row?.saved ?? 0;
}

/**
 * Single source of truth for the available balance. Saved money is not an
 * expense (it doesn't count toward budgets), but it isn't available either.
 */
export async function getBalance(db: SQLiteDatabase): Promise<BalanceBreakdown> {
  const [{ income, expenses }, saved] = await Promise.all([
    getSummary(db),
    getTotalSaved(db),
  ]);
  return { income, expenses, saved, available: income - expenses - saved };
}
