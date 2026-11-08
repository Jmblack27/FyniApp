import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { AppTheme } from "../constants/theme";
import { getCategory } from "../features/transactions/categories";
import type { TransactionType } from "../features/transactions/types";
import { useDashboardData } from "../features/transactions/useDashboardData";
import { useAppTheme } from "../hooks/useApppTheme";
import { useThemeStore } from "../store/storeTheme";
import { formatCurrency } from "../utils/formatCurrency";
import { formatRelativeDay } from "../utils/formatDate";

function openAddTransaction(type: TransactionType) {
  router.push({ pathname: "/add-transaction", params: { type } });
}

export default function DashboardScreen() {
  const { theme, isDark } = useAppTheme();
  const setMode = useThemeStore((state) => state.setMode);
  const { summary, recent, loading, error } = useDashboardData();

  const styles = createStyles(theme.colors);

  const toggleTheme = () => {
    setMode(isDark ? "light" : "dark");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>FYNI</Text>
            <Text style={styles.greeting}>Hello 👋</Text>
            <Text style={styles.subtitle}>
              Here&apos;s your financial summary
            </Text>
          </View>

          <Pressable
            style={styles.themeButton}
            onPress={toggleTheme}
            accessibilityRole="button"
            accessibilityLabel={
              isDark ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            <Ionicons
              name={isDark ? "sunny-outline" : "moon-outline"}
              size={22}
              color={theme.colors.text}
            />
          </Pressable>
        </View>

        {/* Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available balance</Text>

          <Text style={styles.balanceAmount}>
            {formatCurrency(summary.balance)}
          </Text>

          <View style={styles.balanceFooter}>
            <Ionicons name="wallet-outline" size={17} color="#C2DDD3" />
            <Text style={styles.balanceFooterText}>
              All your money in one place
            </Text>
          </View>
        </View>

        {/* Income and expenses */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="arrow-down-outline"
                size={20}
                color={theme.colors.income}
              />
            </View>

            <Text style={styles.summaryLabel}>Income</Text>

            <Text style={styles.incomeAmount}>
              {formatCurrency(summary.income)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="arrow-up-outline"
                size={20}
                color={theme.colors.expense}
              />
            </View>

            <Text style={styles.summaryLabel}>Expenses</Text>

            <Text style={styles.expenseAmount}>
              {formatCurrency(summary.expenses)}
            </Text>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.actions}>
          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => openAddTransaction("INCOME")}
            accessibilityRole="button"
          >
            <Ionicons name="add-circle-outline" size={21} color="#FFFFFF" />
            <Text style={styles.actionText}>Add income</Text>
          </Pressable>

          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.expense },
            ]}
            onPress={() => openAddTransaction("EXPENSE")}
            accessibilityRole="button"
          >
            <Ionicons name="remove-circle-outline" size={21} color="#FFFFFF" />
            <Text style={styles.actionText}>Add expense</Text>
          </Pressable>
        </View>

        {/* Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent transactions</Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {!loading && !error && recent.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.transactionIcon}>
              <Ionicons
                name="receipt-outline"
                size={22}
                color={theme.colors.secondaryText}
              />
            </View>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first income or expense to see your summary
            </Text>
          </View>
        )}

        {recent.map((transaction) => {
          const isIncome = transaction.type === "INCOME";
          const category = getCategory(transaction.category);

          return (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionIcon}>
                <Ionicons
                  name={category.icon}
                  size={22}
                  color={theme.colors.text}
                />
              </View>

              <View style={styles.transactionInfo}>
                <Text style={styles.transactionTitle} numberOfLines={1}>
                  {transaction.title}
                </Text>

                <Text style={styles.transactionSubtitle}>
                  {category.label} · {formatRelativeDay(transaction.createdAt)}
                </Text>
              </View>

              <Text
                style={[
                  styles.transactionAmount,
                  {
                    color: isIncome ? theme.colors.income : theme.colors.text,
                  },
                ]}
              >
                {isIncome ? "+" : "-"}
                {formatCurrency(transaction.amount)}
              </Text>
            </View>
          );
        })}

        <Text style={styles.version}>FYNI APP · PERSONAL FINANCE</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: AppTheme["colors"]) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
      paddingBottom: 40,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 25,
    },
    brand: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 3,
      color: colors.primary,
    },
    greeting: {
      fontSize: 27,
      fontWeight: "800",
      color: colors.text,
      marginTop: 8,
    },
    subtitle: {
      color: colors.secondaryText,
      fontSize: 13,
      marginTop: 5,
    },
    themeButton: {
      width: 45,
      height: 45,
      borderRadius: 15,
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    balanceCard: {
      backgroundColor: "#173D35",
      padding: 24,
      borderRadius: 22,
      marginBottom: 18,
    },
    balanceLabel: {
      color: "#C2DDD3",
      fontSize: 13,
    },
    balanceAmount: {
      color: "#FFFFFF",
      fontSize: 29,
      fontWeight: "800",
      marginVertical: 17,
    },
    balanceFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    balanceFooterText: {
      color: "#C2DDD3",
      fontSize: 12,
    },
    summaryContainer: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 18,
    },
    summaryCard: {
      flex: 1,
      padding: 16,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.iconBackground,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.secondaryText,
    },
    incomeAmount: {
      color: colors.income,
      fontSize: 15,
      fontWeight: "800",
      marginTop: 7,
    },
    expenseAmount: {
      color: colors.expense,
      fontSize: 15,
      fontWeight: "800",
      marginTop: 7,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.text,
    },
    transactionCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
    },
    emptyState: {
      alignItems: "center",
      padding: 24,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "700",
      marginTop: 4,
    },
    emptySubtitle: {
      color: colors.secondaryText,
      fontSize: 12,
      textAlign: "center",
    },
    transactionIcon: {
      width: 43,
      height: 43,
      borderRadius: 13,
      backgroundColor: colors.iconBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    transactionInfo: {
      flex: 1,
      marginLeft: 12,
    },
    transactionTitle: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "700",
    },
    transactionSubtitle: {
      color: colors.secondaryText,
      fontSize: 11,
      marginTop: 5,
    },
    transactionAmount: {
      marginLeft: 8,
      fontSize: 12,
      fontWeight: "800",
    },
    actions: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 30,
    },
    errorText: {
      color: colors.expense,
      fontWeight: "600",
      marginBottom: 10,
    },
    actionButton: {
      flex: 1,
      padding: 15,
      borderRadius: 14,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
    },
    actionText: {
      color: "#FFFFFF",
      fontWeight: "700",
    },
    version: {
      textAlign: "center",
      color: colors.secondaryText,
      fontSize: 9,
      letterSpacing: 2,
      marginTop: 30,
    },
  });
}
