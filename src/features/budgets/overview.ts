import { CATEGORIES } from "../transactions/categories";
import type {
  Budget,
  BudgetOverview,
  BudgetStatus,
  CategoryBudget,
} from "./types";

/** From this share of the limit on, a budget is shown as a warning. */
export const WARNING_RATIO = 0.8;

export function budgetStatus(spent: number, limit: number): BudgetStatus {
  if (spent > limit) return "over";
  if (spent >= limit * WARNING_RATIO) return "warning";
  return "ok";
}

/**
 * Pure: combines stored budgets with this month's spending per category.
 * Kept free of database and React so the rules are easy to reason about.
 */
export function buildBudgetOverview(
  budgets: Budget[],
  spendingByCategory: Map<string, number>,
): BudgetOverview {
  const limits = new Map(budgets.map((b) => [b.category, b.amount]));

  const items: CategoryBudget[] = CATEGORIES.EXPENSE.map((category) => {
    const limit = limits.get(category.id) ?? null;
    const spent = spendingByCategory.get(category.id) ?? 0;
    return {
      category,
      limit,
      spent,
      ratio: limit === null ? null : spent / limit,
      status: limit === null ? null : budgetStatus(spent, limit),
    };
  });

  const budgeted = items.filter((i) => i.limit !== null);
  const unbudgeted = items.filter((i) => i.limit === null);
  budgeted.sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0));

  return {
    items: [...budgeted, ...unbudgeted],
    budgetedCount: budgeted.length,
    overCount: budgeted.filter((i) => i.status === "over").length,
    totalLimit: budgeted.reduce((sum, i) => sum + (i.limit ?? 0), 0),
    totalSpent: budgeted.reduce((sum, i) => sum + i.spent, 0),
  };
}
