import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { AppTheme } from "../constants/theme";
import { CATEGORIES } from "../features/transactions/categories";
import { addTransaction } from "../features/transactions/repository";
import type { TransactionType } from "../features/transactions/types";
import { useAppTheme } from "../hooks/useApppTheme";
import { formatCurrency } from "../utils/formatCurrency";

// 12 digits = up to 999,999,999,999 COP; keeps sums well inside safe integers.
const MAX_AMOUNT_DIGITS = 12;

export default function AddTransactionScreen() {
  const db = useSQLiteContext();
  const { theme } = useAppTheme();
  const styles = createStyles(theme.colors);
  const params = useLocalSearchParams<{ type?: string }>();

  const [type, setType] = useState<TransactionType>(
    params.type === "INCOME" ? "INCOME" : "EXPENSE",
  );
  const [digits, setDigits] = useState("");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = digits ? Number(digits) : 0;
  const categories = CATEGORIES[type];
  const category = categories.find((c) => c.id === categoryId) ?? null;
  const accent = type === "INCOME" ? theme.colors.income : theme.colors.expense;
  const canSave = amount > 0 && category !== null && !saving;

  const changeType = (next: TransactionType) => {
    if (next === type) return;
    setType(next);
    setCategoryId(null); // categories differ per type
    setError(null);
  };

  const onAmountChange = (text: string) => {
    const onlyDigits = text.replace(/\D/g, "").replace(/^0+/, "");
    setDigits(onlyDigits.slice(0, MAX_AMOUNT_DIGITS));
    setError(null);
  };

  const save = async () => {
    if (!canSave || !category) return;
    setSaving(true);
    setError(null);
    try {
      await addTransaction(db, {
        type,
        amount,
        category: category.id,
        title: title.trim() || category.label,
      });
      router.back();
    } catch (e) {
      console.error("[AddTransaction] save failed", e);
      setError("Couldn't save. Please try again.");
      setSaving(false);
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
            {type === "INCOME" ? "Add income" : "Add expense"}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type switch */}
          <View style={styles.segment}>
            {(["INCOME", "EXPENSE"] as const).map((t) => {
              const selected = t === type;
              const color =
                t === "INCOME" ? theme.colors.income : theme.colors.expense;
              return (
                <Pressable
                  key={t}
                  onPress={() => changeType(t)}
                  style={[
                    styles.segmentItem,
                    selected && { backgroundColor: color },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      selected && styles.segmentTextSelected,
                    ]}
                  >
                    {t === "INCOME" ? "Income" : "Expense"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Amount */}
          <Text style={styles.label}>Amount</Text>
          <TextInput
            value={digits ? formatCurrency(amount) : ""}
            onChangeText={onAmountChange}
            placeholder={formatCurrency(0)}
            placeholderTextColor={theme.colors.secondaryText}
            keyboardType="number-pad"
            autoFocus
            style={[styles.amountInput, { color: accent }]}
            accessibilityLabel="Amount"
          />

          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.chips}>
            {categories.map((c) => {
              const selected = c.id === categoryId;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => {
                    setCategoryId(c.id);
                    setError(null);
                  }}
                  style={[
                    styles.chip,
                    selected && {
                      borderColor: accent,
                      backgroundColor: theme.colors.primaryLight,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Ionicons
                    name={c.icon}
                    size={16}
                    color={selected ? accent : theme.colors.secondaryText}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      selected && { color: theme.colors.text },
                    ]}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Description */}
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={category?.label ?? "e.g. Supermarket"}
            placeholderTextColor={theme.colors.secondaryText}
            maxLength={60}
            returnKeyType="done"
            style={styles.textInput}
          />

          {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={save}
            disabled={!canSave}
            style={[
              styles.saveButton,
              { backgroundColor: accent },
              !canSave && styles.disabled,
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave }}
          >
            <Text style={styles.saveText}>
              {saving
                ? "Saving…"
                : type === "INCOME"
                  ? "Save income"
                  : "Save expense"}
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
    segment: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 4,
      marginBottom: 24,
    },
    segmentItem: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: "center",
    },
    segmentText: { fontWeight: "700", color: colors.secondaryText },
    segmentTextSelected: { color: "#FFFFFF" },
    label: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.secondaryText,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    amountInput: {
      fontSize: 34,
      fontWeight: "800",
      paddingVertical: 8,
      marginBottom: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipText: { fontSize: 13, fontWeight: "600", color: colors.secondaryText },
    textInput: {
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    error: { color: colors.expense, marginTop: 16, fontWeight: "600" },
    footer: { padding: 20, paddingTop: 8 },
    saveButton: { padding: 16, borderRadius: 14, alignItems: "center" },
    saveText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
    disabled: { opacity: 0.45 },
  });
}
