import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ProgressBar } from "../../components/ProgressBar";
import { useAppTheme } from "../../hooks/useApppTheme";
import { formatCurrency } from "../../utils/formatCurrency";
import { goalProgress } from "./rules";
import type { Savings } from "./types";

export function SavingsCard({
  savings,
  onPress,
}: {
  savings: Savings;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const progress = goalProgress(savings.saved, savings.goal);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${savings.name}`}
    >
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: colors.primaryLight }]}>
          <Ionicons
            name={progress?.reached ? "trophy-outline" : "save-outline"}
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {savings.name}
          </Text>
          <Text style={[styles.muted, { color: colors.secondaryText }]}>
            {progress === null
              ? "No goal"
              : progress.reached
                ? "Goal reached"
                : `${formatCurrency(progress.remaining)} to go`}
          </Text>
        </View>
        <Text style={[styles.amount, { color: colors.text }]}>
          {formatCurrency(savings.saved)}
        </Text>
      </View>

      {progress && savings.goal !== null && (
        <View style={styles.goal}>
          <ProgressBar
            progress={progress.ratio}
            color={progress.reached ? colors.income : colors.primary}
          />
          <View style={styles.goalFooter}>
            <Text style={[styles.muted, { color: colors.secondaryText }]}>
              {Math.min(Math.floor(progress.ratio * 100), 999)}%
            </Text>
            <Text style={[styles.muted, { color: colors.secondaryText }]}>
              Goal {formatCurrency(savings.goal)}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 10, gap: 12 },
  top: { flexDirection: "row", alignItems: "center" },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, marginLeft: 12, gap: 4 },
  name: { fontSize: 14, fontWeight: "700" },
  muted: { fontSize: 12 },
  amount: { fontSize: 14, fontWeight: "800", marginLeft: 8 },
  goal: { gap: 6 },
  goalFooter: { flexDirection: "row", justifyContent: "space-between" },
});
