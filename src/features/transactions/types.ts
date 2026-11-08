export type TransactionType = "INCOME" | "EXPENSE";

export interface Transaction {
  id: number;
  type: TransactionType;
  title: string;
  /** Category id from categories.ts */
  category: string;
  /** Whole Colombian pesos, always positive; `type` gives the sign. */
  amount: number;
  /** Unix epoch milliseconds */
  createdAt: number;
}

export interface NewTransaction {
  type: TransactionType;
  title: string;
  category: string;
  amount: number;
}

export interface TransactionSummary {
  income: number;
  expenses: number;
  balance: number;
}
