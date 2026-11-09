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
import { getBalance } from "../features/balance/repository";
import { getSavings, MovementError, moveMoney } from "../features/savings/repository";
import { validateMovement } from "../features/savings/rules";
import type { MovementKind, Savings } from "../features/savings/types";
import { useAppTheme } from "../hooks/useApppTheme";
import { formatCurrency } from "../utils/formatCurrency";

/** Add money to a savings (from the available balance) or withdraw it back. */
export default function SavingsMoveScreen() {
  const db = useSQLiteContext();
  const { theme } = useAppTheme();
  const styles = createStyles(theme.colors);
  const params = useLocalSearchParams<{ id?: string; kind?: string }>();
  const id = Number(params.id);
  const kind: MovementKind = params.kind === "withdraw" ? "withdraw" : "deposit";
  const isDeposit = kind === "deposit";

  const [savings, setSavings] = useState<Savings | null>(null);
  const [available, setAvailable] = useState(0);
  const [amount, setAmount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getSavings(db, id), getBalance(db)])
      .then(([s, balance]) => {
        if (cancelled) return;
        setSavings(s);
        setAvailable(balance.available);
        if (!s) setError("This savings no longer exists.");
        setLoaded(true);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        console.error("[SavingsMove] load failed", e);
        setError("Couldn't load your balance.");
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [db, id]);

  const max = isDeposit ? Math.max(available, 0) : (savings?.saved ?? 0);
  const problem =
    savings && amount > 0
      ? validateMovement(kind, amount, { available, saved: savings.saved })
      : null;
  const canSave = loaded && !!savings && amount > 0 && !problem && !busy;

  const save = async () => {
    if (!savings) return;
    setBusy(true);
    setError(null);
    try {
      await moveMoney(db, savings.id, kind, amount);
      router.back();
    } catch (e) {
      if (e instanceof MovementError) {
        setError(e.message);
      } else {
        console.error("[SavingsMove] save failed", e);
        setError("Couldn't save. Please try again.");
      }
      setBusy(false);
    }
  };

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
            {isDeposit ? "Add money" : "Withdraw"}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {savings && (
            <Text style={styles.subtitle}>
              {isDeposit ? "To " : "From "}
              <Text style={styles.subtitleStrong}>{savings.name}</Text>
            </Text>
          )}

          <Text style={styles.label}>Amount</Text>
          <AmountInput
            value={amount}
            onChange={(next) => {
              setAmount(next);
              setError(null);
            }}
            color={theme.colors.primary}
            autoFocus
          />

          {loaded && savings && (
            <View style={styles.limitRow}>
              <Text style={styles.muted}>
                {isDeposit
                  ? `Available balance: ${formatCurrency(available)}`
                  : `In this savings: ${formatCurrency(savings.saved)}`}
              </Text>
              {max > 0 && (
                <Pressable
                  onPress={() => {
                    setAmount(max);
                    setError(null);
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={isDeposit ? "Use all available" : "Withdraw all"}
                >
                  <Text style={styles.allLink}>{isDeposit ? "Use all" : "Withdraw all"}</Text>
                </Pressable>
              )}
            </View>
          )}

          <Text style={styles.hint}>
            {isDeposit
              ? "This money leaves your available balance until you withdraw it."
              : "This money goes back to your available balance."}
          </Text>

          {(problem || error) && <Text style={styles.error}>{problem ?? error}</Text>}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={save}
            disabled={!canSave}
            style={[styles.saveButton, !canSave && styles.disabled]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave }}
          >
            <Text style={styles.saveText}>
              {busy ? "Saving…" : isDeposit ? "Add to savings" : "Withdraw"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: AppTheme["colors"]) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
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
    subtitle: { fontSize: 15, color: colors.secondaryText, marginBottom: 24 },
    subtitleStrong: { color: colors.text, fontWeight: "800" },
    label: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.secondaryText,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    limitRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: -12,
      marginBottom: 16,
    },
    muted: { fontSize: 13, color: colors.secondaryText },
    allLink: { color: colors.primary, fontWeight: "700", fontSize: 13 },
    hint: { fontSize: 12, color: colors.secondaryText },
    error: { color: colors.expense, marginTop: 16, fontWeight: "600" },
    footer: { padding: 20, paddingTop: 8 },
    saveButton: {
      padding: 16,
      borderRadius: 14,
      alignItems: "center",
      backgroundColor: colors.primary,
    },
    saveText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
    disabled: { opacity: 0.45 },
  });
}
