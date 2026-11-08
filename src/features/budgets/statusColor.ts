import type { AppTheme } from "../../constants/theme";
import type { BudgetStatus } from "./types";

export function budgetStatusColor(
  status: BudgetStatus | null,
  colors: AppTheme["colors"],
): string {
  switch (status) {
    case "over":
      return colors.expense;
    case "warning":
      return colors.warning;
    default:
      return colors.income;
  }
}
