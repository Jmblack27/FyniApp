export type TransactionType = "INCOME" | "EXPENSE";

export interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: TransactionType;
  date: string;
  /** Ionicons glyph name */
  icon: string;
}
