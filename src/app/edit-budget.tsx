import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AmountInput } from "../components/AmountInput";
import type { AppTheme } from "../constants/theme";
import {
  deleteBudget,
  getBudget,
  getExpensesByCategory,
  setBudget,
} from "../features/budgets/repository";
import { CATEGORIES } from "../features/transactions/categories";
import { useAppTheme } from "../hooks/useApppTheme";
import { formatCurrency } from "../utils/formatCurrency";
import { monthRange } from "../utils/month";

export default function EditBudgetScreen() {
  const db = useSQLiteContext();
  const { theme } = useAppTheme();
  const styles = createStyles(theme.colors);
  const params = useLocalSearchParams<{ category?: string }>();

  // Only expense categories can have a budget.
  const category = CATEGORIES.EXPENSE.find((c) => c.id === params.category) ?? null;

  const [amount, setAmount] = useState(0);
  const [hasBudget, setHasBudget] = useState(false);
  const [spent, setSpent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category) return;
    let cancelled = false;
    Promise.all([getBudget(db, category.id), getExpensesByCategory(db, monthRange())])
      .then(([budget, spending]) => {
        if (cancelled) return;
        if (budget) {
          setAmount(budget.amount);
          setHasBudget(true);
        }
        setSpent(spending.get(category.id) ?? 0);
        setLoaded(true);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        console.error("[EditBudget] load failed", e);
        setError("Couldn't load this budget.");
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [db, category]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      router.back();
    } catch (e) {
      console.error("[EditBudget] save failed", e);
      setError("Couldn't save. Please try again.");
      setBusy(false);
    }
  };

  if (!category) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]}>
        <Text style={styles.muted}>This category can&apos;t have a budget.</Text>
        <Pressable onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const canSave = loaded && amount > 0 && !busy;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={26} color={theme.colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {hasBudget ? "Edit budget" : "New budget"}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.categoryRow}>
            <View style={styles.icon}>
              <Ionicons name={category.icon} size={22} color={theme.colors.text} />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryLabel}>{category.label}</Text>
              <Text style={styles.muted}>
                {formatCurrency(spent)} spent this month
              </Text>
            </View>
          </View>

          <Text style={styles.label}>Monthly limit</Text>
          {loaded && (
            <AmountInput
              value={amount}
              onChange={(next) => {
                setAmount(next);
                setError(null);
              }}
              color={theme.colors.primary}
              autoFocus
              accessibilityLabel="Monthly limit"
            />
          )}

          <Text style={styles.hint}>
            The limit repeats every month. Spending resets on the 1st.
          </Text>

          {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={() => run(() => setBudget(db, category.id, amount))}
            disabled={!canSave}
            style={[styles.saveButton, !canSave && styles.disabled]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave }}
          >
            <Text style={styles.saveText}>{busy ? "Saving…" : "Save budget"}</Text>
          </Pressable>

          {hasBudget && (
            <Pressable
              onPress={() => run(() => deleteBudget(db, category.id))}
              disabled={busy}
              style={styles.secondaryButton}
              accessibilityRole="button"
            >
              <Text style={[styles.secondaryText, { color: theme.colors.expense }]}>
                Remove budget
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: AppTheme["colors"]) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    center: { alignItems: "center", justifyContent: "center", gap: 12 },
    flex: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    headerTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
    headerSpacer: { width: 26 },
    content: { padding: 20, paddingTop: 8 },
    categoryRow: { flexDirection: "row", alignItems: "center", marginBottom: 28 },
    icon: {
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor: colors.iconBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    categoryInfo: { marginLeft: 12, gap: 4 },
    categoryLabel: { fontSize: 18, fontWeight: "800", color: colors.text },
    label: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.secondaryText,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    hint: { fontSize: 12, color: colors.secondaryText },
    muted: { fontSize: 12, color: colors.secondaryText },
    error: { color: colors.expense, marginTop: 16, fontWeight: "600" },
    footer: { padding: 20, paddingTop: 8, gap: 4 },
    saveButton: {
      padding: 16,
      borderRadius: 14,
      alignItems: "center",
      backgroundColor: colors.primary,
    },
    saveText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
    disabled: { opacity: 0.45 },
    secondaryButton: { padding: 14, alignItems: "center" },
    secondaryText: { fontWeight: "700", fontSize: 14, color: colors.primary },
  });
}
