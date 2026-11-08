import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";

import { monthRange } from "../../utils/month";
import { buildBudgetOverview } from "./overview";
import { getBudgets, getExpensesByCategory } from "./repository";
import type { BudgetOverview } from "./types";

/**
 * Budgets plus this month's spending. Reloads on focus, so it picks up
 * changes from the add-transaction and edit-budget modals, and a new month
 * starts counting from zero the next time the screen is shown.
 */
export function useBudgetOverview() {
  const db = useSQLiteContext();
  const [overview, setOverview] = useState<BudgetOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const range = monthRange();

      Promise.all([getBudgets(db), getExpensesByCategory(db, range)])
        .then(([budgets, spending]) => {
          if (cancelled) return;
          setOverview(buildBudgetOverview(budgets, spending));
          setError(null);
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          console.error("[useBudgetOverview] failed to load", e);
          setError("Couldn't load your budgets.");
        });

      return () => {
        cancelled = true;
      };
    }, [db]),
  );

  return { overview, loading: overview === null && error === null, error };
}
