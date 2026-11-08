import { StyleSheet, View } from "react-native";

import { useAppTheme } from "../hooks/useApppTheme";

interface ProgressBarProps {
  /** 0..1; values above 1 render as a full bar */
  progress: number;
  color: string;
  height?: number;
}

export function ProgressBar({ progress, color, height = 8 }: ProgressBarProps) {
  const { theme } = useAppTheme();
  const clamped = Math.max(0, Math.min(progress, 1));

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: theme.colors.iconBackground },
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      <View
        style={{
          width: `${clamped * 100}%`,
          height,
          borderRadius: height / 2,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: "100%", overflow: "hidden" },
});
