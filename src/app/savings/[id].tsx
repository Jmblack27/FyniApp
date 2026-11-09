import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProgressBar } from "../../components/ProgressBar";
import type { AppTheme } from "../../constants/theme";
import { goalProgress } from "../../features/savings/rules";
import type { MovementKind } from "../../features/savings/types";
import { useSavingsDetail } from "../../features/savings/useSavings";
import { useAppTheme } from "../../hooks/useApppTheme";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatRelativeDay } from "../../utils/formatDate";

export default function SavingsDetailScreen() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme.colors);
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const { savings, movements, error, notFound } = useSavingsDetail(id);

  const progress = savings ? goalProgress(savings.saved, savings.goal) : null;

  const openMove = (kind: MovementKind) =>
    router.push({ pathname: "/savings-move", params: { id: String(id), kind } });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={26} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {savings?.name ?? "Savings"}
        </Text>
        {savings ? (
          <Pressable
            onPress={() =>
              router.push({ pathname: "/savings-form", params: { id: String(id) } })
            }
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Edit savings"
          >
            <Ionicons name="create-outline" size={23} color={theme.colors.primary} />
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {error && <Text style={styles.errorText}>{error}</Text>}
        {notFound && <Text style={styles.muted}>This savings no longer exists.</Text>}

        {savings && (
          <>
            {/* Amount and goal */}
            <View style={styles.card}>
              <Text style={styles.label}>Saved</Text>
              <Text style={styles.amount}>{formatCurrency(savings.saved)}</Text>

              {progress && savings.goal !== null ? (
                <View style={styles.goal}>
                  <ProgressBar
                    progress={progress.ratio}
                    color={progress.reached ? theme.colors.income : theme.colors.primary}
                    height={10}
                  />
                  <View style={styles.goalFooter}>
                    <Text style={styles.muted}>
                      {progress.reached
                        ? "Goal reached 🎉"
                        : `${formatCurrency(progress.remaining)} to go`}
                    </Text>
                    <Text style={styles.muted}>
                      Goal {formatCurrency(savings.goal)}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.muted}>No goal set</Text>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable
                style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => openMove("deposit")}
                accessibilityRole="button"
              >
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                <Text style={styles.actionText}>Add money</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.actionButton,
                  styles.actionSecondary,
                  savings.saved <= 0 && styles.disabled,
                ]}
                onPress={() => openMove("withdraw")}
                disabled={savings.saved <= 0}
                accessibilityRole="button"
                accessibilityState={{ disabled: savings.saved <= 0 }}
              >
                <Ionicons
                  name="remove-circle-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={[styles.actionText, { color: theme.colors.primary }]}>
                  Withdraw
                </Text>
              </Pressable>
            </View>

            {/* History */}
            <Text style={styles.sectionTitle}>History</Text>
            {movements.length === 0 && (
              <Text style={styles.muted}>No money moved yet.</Text>
            )}
            {movements.map((m) => {
              const isDeposit = m.amount > 0;
              return (
                <View key={m.id} style={styles.row}>
                  <View style={styles.rowIcon}>
                    <Ionicons
                      name={isDeposit ? "arrow-down-outline" : "arrow-up-outline"}
                      size={18}
                      color={isDeposit ? theme.colors.income : theme.colors.text}
                    />
                  </View>
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowTitle}>
                      {isDeposit ? "Added" : "Withdrawn"}
                    </Text>
                    <Text style={styles.muted}>{formatRelativeDay(m.createdAt)}</Text>
                  </View>
                  <Text
                    style={[
                      styles.rowAmount,
                      { color: isDeposit ? theme.colors.income : theme.colors.text },
                    ]}
                  >
                    {isDeposit ? "+" : "-"}
                    {formatCurrency(Math.abs(m.amount))}
                  </Text>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: AppTheme["colors"]) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 12,
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 17,
      fontWeight: "800",
      color: colors.text,
    },
    headerSpacer: { width: 23 },
    content: { padding: 20, paddingTop: 4, paddingBottom: 40 },
    errorText: { color: colors.expense, fontWeight: "600", marginBottom: 12 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      marginBottom: 16,
      gap: 8,
    },
    label: { fontSize: 13, color: colors.secondaryText },
    amount: { fontSize: 30, fontWeight: "800", color: colors.text },
    goal: { gap: 8, marginTop: 4 },
    goalFooter: { flexDirection: "row", justifyContent: "space-between" },
    muted: { fontSize: 12, color: colors.secondaryText },
    actions: { flexDirection: "row", gap: 12, marginBottom: 28 },
    actionButton: {
      flex: 1,
      padding: 15,
      borderRadius: 14,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
    },
    actionSecondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    actionText: { color: "#FFFFFF", fontWeight: "700" },
    disabled: { opacity: 0.45 },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 12,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
    },
    rowIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: colors.iconBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    rowInfo: { flex: 1, marginLeft: 12, gap: 4 },
    rowTitle: { fontSize: 13, fontWeight: "700", color: colors.text },
    rowAmount: { fontSize: 13, fontWeight: "800", marginLeft: 8 },
  });
}
