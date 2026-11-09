import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";

import { getBalance, type BalanceBreakdown } from "../balance/repository";
import { getRecentTransactions } from "./repository";
import type { Transaction } from "./types";

const RECENT_LIMIT = 10;

const EMPTY_SUMMARY: BalanceBreakdown = { income: 0, expenses: 0, saved: 0, available: 0 };

/**
 * Loads the summary and recent transactions, and reloads every time the
 * screen regains focus (e.g. after the add-transaction modal closes).
 */
export function useDashboardData() {
  const db = useSQLiteContext();
  const [summary, setSummary] = useState<BalanceBreakdown>(EMPTY_SUMMARY);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      Promise.all([getBalance(db), getRecentTransactions(db, RECENT_LIMIT)])
        .then(([nextSummary, nextRecent]) => {
          if (cancelled) return;
          setSummary(nextSummary);
          setRecent(nextRecent);
          setError(null);
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          console.error("[useDashboardData] failed to load", e);
          setError("Couldn't load your transactions.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [db])
  );

  return { summary, recent, loading, error };
}
