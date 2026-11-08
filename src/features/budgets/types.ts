import type { Category } from "../transactions/categories";

export interface Budget {
  /** Expense category id */
  category: string;
  /** Monthly limit in whole COP */
  amount: number;
}

export type BudgetStatus = "ok" | "warning" | "over";

export interface CategoryBudget {
  category: Category;
  /** null when the category has no budget */
  limit: number | null;
  /** Spent in this category during the current month */
  spent: number;
  /** spent / limit; null when there is no budget */
  ratio: number | null;
  status: BudgetStatus | null;
}

export interface BudgetOverview {
  /** Every expense category: budgeted ones first (most at risk first), then the rest */
  items: CategoryBudget[];
  budgetedCount: number;
  overCount: number;
  /** Sum of all limits */
  totalLimit: number;
  /** Spent this month in budgeted categories only */
  totalSpent: number;
}
