import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";

import { getAllSavings, getMovements, getSavings } from "./repository";
import type { Savings, SavingsMovement } from "./types";

/** All savings with their current amounts; reloads on focus. */
export function useSavingsList() {
  const db = useSQLiteContext();
  const [savings, setSavings] = useState<Savings[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getAllSavings(db)
        .then((list) => {
          if (cancelled) return;
          setSavings(list);
          setError(null);
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          console.error("[useSavingsList] failed to load", e);
          setError("Couldn't load your savings.");
        });
      return () => {
        cancelled = true;
      };
    }, [db]),
  );

  const total = savings?.reduce((sum, s) => sum + s.saved, 0) ?? 0;
  return { savings, total, loading: savings === null && error === null, error };
}

/** One savings and its movement history; reloads on focus. */
export function useSavingsDetail(id: number) {
  const db = useSQLiteContext();
  const [savings, setSavings] = useState<Savings | null>(null);
  const [movements, setMovements] = useState<SavingsMovement[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      if (!Number.isInteger(id)) {
        setLoaded(true);
        return;
      }
      Promise.all([getSavings(db, id), getMovements(db, id)])
        .then(([nextSavings, nextMovements]) => {
          if (cancelled) return;
          setSavings(nextSavings);
          setMovements(nextMovements);
          setError(null);
          setLoaded(true);
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          console.error("[useSavingsDetail] failed to load", e);
          setError("Couldn't load this savings.");
          setLoaded(true);
        });
      return () => {
        cancelled = true;
      };
    }, [db, id]),
  );

  return { savings, movements, loaded, error, notFound: loaded && !error && !savings };
}
