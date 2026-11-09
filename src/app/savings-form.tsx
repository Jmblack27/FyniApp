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
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AmountInput } from "../components/AmountInput";
import type { AppTheme } from "../constants/theme";
import {
  createSavings,
  deleteSavings,
  getSavings,
  updateSavings,
} from "../features/savings/repository";
import { MAX_NAME_LENGTH, validateName } from "../features/savings/rules";
import { useAppTheme } from "../hooks/useApppTheme";
import { formatCurrency } from "../utils/formatCurrency";

/** Create a savings, or edit its name and goal when an `id` param is given. */
export default function SavingsFormScreen() {
  const db = useSQLiteContext();
  const { theme } = useAppTheme();
  const styles = createStyles(theme.colors);
  const params = useLocalSearchParams<{ id?: string }>();
  const editingId = params.id ? Number(params.id) : null;
  const isEditing = editingId !== null && Number.isInteger(editingId);

  const [name, setName] = useState("");
  const [hasGoal, setHasGoal] = useState(false);
  const [goal, setGoal] = useState(0);
  const [saved, setSaved] = useState(0);
  const [loaded, setLoaded] = useState(!isEditing);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditing || editingId === null) return;
    let cancelled = false;
    getSavings(db, editingId)
      .then((s) => {
        if (cancelled) return;
        if (s) {
          setName(s.name);
          setHasGoal(s.goal !== null);
          setGoal(s.goal ?? 0);
          setSaved(s.saved);
        } else {
          setError("This savings no longer exists.");
        }
        setLoaded(true);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        console.error("[SavingsForm] load failed", e);
        setError("Couldn't load this savings.");
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [db, editingId, isEditing]);

  const canSave = loaded && name.trim().length > 0 && (!hasGoal || goal > 0) && !busy;

  const save = async () => {
    const result = validateName(name);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    if (hasGoal && goal <= 0) {
      setError("Enter a goal amount, or turn the goal off.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const goalValue = hasGoal ? goal : null;
      if (isEditing && editingId !== null) {
        await updateSavings(db, editingId, result.name, goalValue);
      } else {
        await createSavings(db, result.name, goalValue);
      }
      router.back();
    } catch (e) {
      console.error("[SavingsForm] save failed", e);
      setError("Couldn't save. Please try again.");
      setBusy(false);
    }
  };

  const remove = async () => {
    if (editingId === null) return;
    setBusy(true);
    setError(null);
    try {
      await deleteSavings(db, editingId);
      // The detail screen behind this modal no longer exists.
      router.dismissTo("/savings");
    } catch (e) {
      console.error("[SavingsForm] delete failed", e);
      setError("Couldn't delete. Please try again.");
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
            {isEditing ? "Edit savings" : "New savings"}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Name */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError(null);
            }}
            placeholder="e.g. Trip to Cartagena"
            placeholderTextColor={theme.colors.secondaryText}
            maxLength={MAX_NAME_LENGTH}
            autoFocus={!isEditing}
            returnKeyType="done"
            style={styles.textInput}
            accessibilityLabel="Savings name"
          />

          {/* Goal */}
          <View style={styles.goalRow}>
            <View style={styles.goalInfo}>
              <Text style={styles.goalTitle}>Set a goal</Text>
              <Text style={styles.muted}>Optional. Track how close you are.</Text>
            </View>
            <Switch
              value={hasGoal}
              onValueChange={(value) => {
                setHasGoal(value);
                setError(null);
              }}
              trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
              accessibilityLabel="Set a goal"
            />
          </View>

          {hasGoal && loaded && (
            <>
              <Text style={styles.label}>Goal amount</Text>
              <AmountInput
                value={goal}
                onChange={(next) => {
                  setGoal(next);
                  setError(null);
                }}
                color={theme.colors.primary}
                accessibilityLabel="Goal amount"
              />
            </>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          {/* Delete */}
          {isEditing && loaded && (
            <View style={styles.deleteBox}>
              {!confirmingDelete ? (
                <Pressable
                  onPress={() => setConfirmingDelete(true)}
                  disabled={busy}
                  style={styles.deleteButton}
                  accessibilityRole="button"
                >
                  <Ionicons name="trash-outline" size={18} color={theme.colors.expense} />
                  <Text style={styles.deleteText}>Delete savings</Text>
                </Pressable>
              ) : (
                <View style={styles.confirm}>
                  <Text style={styles.confirmText}>
                    {saved > 0
                      ? `Delete "${name.trim()}"? Its ${formatCurrency(saved)} will go back to your available balance.`
                      : `Delete "${name.trim()}"?`}
                  </Text>
                  <View style={styles.confirmActions}>
                    <Pressable
                      onPress={() => setConfirmingDelete(false)}
                      disabled={busy}
                      style={[styles.confirmButton, styles.cancelButton]}
                      accessibilityRole="button"
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={remove}
                      disabled={busy}
                      style={[styles.confirmButton, { backgroundColor: theme.colors.expense }]}
                      accessibilityRole="button"
                    >
                      <Text style={styles.confirmDeleteText}>
                        {busy ? "Deleting…" : "Delete"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}
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
              {busy && !confirmingDelete
                ? "Saving…"
                : isEditing
                  ? "Save changes"
                  : "Create savings"}
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
    label: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.secondaryText,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    textInput: {
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 13,
      marginBottom: 24,
    },
    goalRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      marginBottom: 24,
    },
    goalInfo: { flex: 1, gap: 4 },
    goalTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
    muted: { fontSize: 12, color: colors.secondaryText },
    error: { color: colors.expense, marginBottom: 16, fontWeight: "600" },
    deleteBox: { marginTop: 8 },
    deleteButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 14,
    },
    deleteText: { color: colors.expense, fontWeight: "700" },
    confirm: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.expense,
      borderRadius: 14,
      padding: 14,
      gap: 12,
    },
    confirmText: { color: colors.text, fontSize: 13, lineHeight: 19 },
    confirmActions: { flexDirection: "row", gap: 10 },
    confirmButton: { flex: 1, padding: 12, borderRadius: 12, alignItems: "center" },
    cancelButton: { borderWidth: 1, borderColor: colors.border },
    cancelText: { color: colors.text, fontWeight: "700" },
    confirmDeleteText: { color: "#FFFFFF", fontWeight: "800" },
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
