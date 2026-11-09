import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { AppTheme } from "../../constants/theme";
import { SavingsCard } from "../../features/savings/SavingsCard";
import { useSavingsList } from "../../features/savings/useSavings";
import { useAppTheme } from "../../hooks/useApppTheme";
import { formatCurrency } from "../../utils/formatCurrency";

export default function SavingsScreen() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme.colors);
  const { savings, total, error } = useSavingsList();

  const openNew = () => router.push("/savings-form");

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
        <Text style={styles.headerTitle}>Savings</Text>
        <Pressable
          onPress={openNew}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="New savings"
        >
          <Ionicons name="add" size={26} color={theme.colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Total */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total saved</Text>
          <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
          <View style={styles.totalFooter}>
            <Ionicons name="lock-closed-outline" size={14} color="#C2DDD3" />
            <Text style={styles.totalFooterText}>
              Not included in your available balance
            </Text>
          </View>
        </View>

        {savings && savings.length === 0 && (
          <View style={styles.intro}>
            <Ionicons name="save-outline" size={28} color={theme.colors.primary} />
            <Text style={styles.introTitle}>Start saving</Text>
            <Text style={styles.introText}>
              Create a savings for anything, like a trip or an emergency fund,
              and optionally set a goal.
            </Text>
          </View>
        )}

        {savings?.map((s) => (
          <SavingsCard
            key={s.id}
            savings={s}
            onPress={() =>
              router.push({ pathname: "/savings/[id]", params: { id: String(s.id) } })
            }
          />
        ))}

        <Pressable
          style={styles.newButton}
          onPress={openNew}
          accessibilityRole="button"
        >
          <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.newButtonText}>New savings</Text>
        </Pressable>
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
    },
    headerTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
    content: { padding: 20, paddingTop: 4, paddingBottom: 40 },
    errorText: { color: colors.expense, fontWeight: "600", marginBottom: 12 },
    totalCard: {
      backgroundColor: "#173D35",
      borderRadius: 22,
      padding: 22,
      marginBottom: 24,
    },
    totalLabel: { color: "#C2DDD3", fontSize: 13 },
    totalAmount: {
      color: "#FFFFFF",
      fontSize: 28,
      fontWeight: "800",
      marginVertical: 12,
    },
    totalFooter: { flexDirection: "row", alignItems: "center", gap: 6 },
    totalFooterText: { color: "#C2DDD3", fontSize: 12 },
    intro: {
      alignItems: "center",
      padding: 24,
      gap: 8,
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    introTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
    introText: { fontSize: 13, color: colors.secondaryText, textAlign: "center" },
    newButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.primary,
      marginTop: 6,
    },
    newButtonText: { color: colors.primary, fontWeight: "700" },
  });
}
