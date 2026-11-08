import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProgressBar } from "../components/ProgressBar";
import type { AppTheme } from "../constants/theme";
import { budgetStatus } from "../features/budgets/overview";
import { budgetStatusColor } from "../features/budgets/statusColor";
import type { CategoryBudget } from "../features/budgets/types";
import { useBudgetOverview } from "../features/budgets/useBudgetOverview";
import { useAppTheme } from "../hooks/useApppTheme";
import { formatCurrency } from "../utils/formatCurrency";
import { daysLeftInMonth, formatMonth } from "../utils/month";

function openEditBudget(category: string) {
  router.push({ pathname: "/edit-budget", params: { category } });
}

export default function BudgetsScreen() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme.colors);
  const { overview, error } = useBudgetOverview();

  const budgeted = overview?.items.filter((i) => i.limit !== null) ?? [];
  const unbudgeted = overview?.items.filter((i) => i.limit === null) ?? [];
  const totalRatio =
    overview && overview.totalLimit > 0 ? overview.totalSpent / overview.totalLimit : 0;
  const remaining = overview ? overview.totalLimit - overview.totalSpent : 0;
  const daysLeft = daysLeftInMonth();

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
        <Text style={styles.headerTitle}>Budgets</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.month}>{formatMonth()}</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Total */}
        {overview && overview.budgetedCount > 0 && (
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>
              {remaining >= 0 ? "Left to spend" : "Over budget"}
            </Text>
            <Text
              style={[
                styles.totalAmount,
                remaining < 0 && { color: theme.colors.expense },
              ]}
            >
              {formatCurrency(Math.abs(remaining))}
            </Text>
            <ProgressBar
              progress={totalRatio}
              color={budgetStatusColor(
                budgetStatus(overview.totalSpent, overview.totalLimit),
                theme.colors,
              )}
            />
            <View style={styles.totalFooter}>
              <Text style={styles.muted}>
                {formatCurrency(overview.totalSpent)} of{" "}
                {formatCurrency(overview.totalLimit)}
              </Text>
              <Text style={styles.muted}>
                {daysLeft} {daysLeft === 1 ? "day" : "days"} left
              </Text>
            </View>
          </View>
        )}

        {overview && overview.budgetedCount === 0 && (
          <View style={styles.intro}>
            <Ionicons name="pie-chart-outline" size={28} color={theme.colors.primary} />
            <Text style={styles.introTitle}>Set your first budget</Text>
            <Text style={styles.introText}>
              Pick a category below and choose how much you want to spend on it
              each month.
            </Text>
          </View>
        )}

        {budgeted.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Your budgets</Text>
            {budgeted.map((item) => (
              <BudgetRow key={item.category.id} item={item} styles={styles} theme={theme} />
            ))}
          </>
        )}

        {unbudgeted.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              {budgeted.length > 0 ? "Other categories" : "Categories"}
            </Text>
            {unbudgeted.map((item) => (
              <Pressable
                key={item.category.id}
                style={styles.row}
                onPress={() => openEditBudget(item.category.id)}
                accessibilityRole="button"
                accessibilityLabel={`Set budget for ${item.category.label}`}
              >
                <View style={styles.icon}>
                  <Ionicons name={item.category.icon} size={20} color={theme.colors.text} />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>{item.category.label}</Text>
                  <Text style={styles.muted}>
                    {item.spent > 0
                      ? `${formatCurrency(item.spent)} spent this month`
                      : "No budget"}
                  </Text>
                </View>
                <Text style={styles.setLink}>Set</Text>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function BudgetRow({
  item,
  styles,
  theme,
}: {
  item: CategoryBudget;
  styles: ReturnType<typeof createStyles>;
  theme: AppTheme;
}) {
  const limit = item.limit ?? 0;
  const left = limit - item.spent;
  const color = budgetStatusColor(item.status, theme.colors);

  return (
    <Pressable
      style={styles.budgetCard}
      onPress={() => openEditBudget(item.category.id)}
      accessibilityRole="button"
      accessibilityLabel={`Edit budget for ${item.category.label}`}
    >
      <View style={styles.budgetTop}>
        <View style={styles.icon}>
          <Ionicons name={item.category.icon} size={20} color={theme.colors.text} />
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.rowTitle}>{item.category.label}</Text>
          <Text style={styles.muted}>
            {formatCurrency(item.spent)} of {formatCurrency(limit)}
          </Text>
        </View>
        <Text style={[styles.leftText, { color }]}>
          {left >= 0
            ? `${formatCurrency(left)} left`
            : `${formatCurrency(-left)} over`}
        </Text>
      </View>
      <ProgressBar progress={item.ratio ?? 0} color={color} />
    </Pressable>
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
    },
    headerTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
    headerSpacer: { width: 26 },
    content: { padding: 20, paddingTop: 4, paddingBottom: 40 },
    month: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.secondaryText,
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 12,
    },
    errorText: { color: colors.expense, fontWeight: "600", marginBottom: 12 },
    totalCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      marginBottom: 26,
      gap: 10,
    },
    totalLabel: { fontSize: 13, color: colors.secondaryText },
    totalAmount: { fontSize: 28, fontWeight: "800", color: colors.text },
    totalFooter: { flexDirection: "row", justifyContent: "space-between" },
    intro: {
      alignItems: "center",
      padding: 24,
      gap: 8,
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 26,
    },
    introTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
    introText: { fontSize: 13, color: colors.secondaryText, textAlign: "center" },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 12,
    },
    budgetCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 10,
      gap: 12,
    },
    budgetTop: { flexDirection: "row", alignItems: "center" },
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
    icon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.iconBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    rowInfo: { flex: 1, marginLeft: 12, gap: 4 },
    rowTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
    muted: { fontSize: 12, color: colors.secondaryText },
    leftText: { fontSize: 12, fontWeight: "800", marginLeft: 8 },
    setLink: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  });
}
