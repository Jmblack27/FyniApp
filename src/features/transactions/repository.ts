import type { SQLiteDatabase } from "expo-sqlite";

import type {
  NewTransaction,
  Transaction,
  TransactionSummary,
  TransactionType,
} from "./types";

interface TransactionRow {
  id: number;
  type: TransactionType;
  title: string;
  category: string;
  amount: number;
  created_at: number;
}

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    category: row.category,
    amount: row.amount,
    createdAt: row.created_at,
  };
}

export async function getRecentTransactions(
  db: SQLiteDatabase,
  limit: number
): Promise<Transaction[]> {
  const rows = await db.getAllAsync<TransactionRow>(
    "SELECT * FROM transactions ORDER BY created_at DESC, id DESC LIMIT ?",
    limit
  );
  return rows.map(toTransaction);
}

export async function getSummary(
  db: SQLiteDatabase
): Promise<TransactionSummary> {
  const row = await db.getFirstAsync<{ income: number; expenses: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount END), 0) AS expenses
     FROM transactions`
  );
  const income = row?.income ?? 0;
  const expenses = row?.expenses ?? 0;
  return { income, expenses, balance: income - expenses };
}

export async function addTransaction(
  db: SQLiteDatabase,
  tx: NewTransaction
): Promise<void> {
  await db.runAsync(
    "INSERT INTO transactions (type, title, category, amount, created_at) VALUES (?, ?, ?, ?, ?)",
    tx.type,
    tx.title,
    tx.category,
    tx.amount,
    Date.now()
  );
}
