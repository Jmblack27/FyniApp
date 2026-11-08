import { StyleSheet, TextInput, type StyleProp, type TextStyle } from "react-native";

import { useAppTheme } from "../hooks/useApppTheme";
import { formatCurrency } from "../utils/formatCurrency";

// 12 digits = up to 999,999,999,999 COP; keeps sums well inside safe integers.
const MAX_AMOUNT_DIGITS = 12;

/** Keeps only digits from formatted input ("$ 5.000" -> 5000); 0 when empty. */
export function parseAmountInput(text: string): number {
  const digits = text.replace(/\D/g, "").replace(/^0+/, "").slice(0, MAX_AMOUNT_DIGITS);
  return digits ? Number(digits) : 0;
}

interface AmountInputProps {
  /** Whole COP; 0 shows the placeholder */
  value: number;
  onChange: (amount: number) => void;
  color?: string;
  autoFocus?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<TextStyle>;
}

/** Large COP amount field that formats as the user types. */
export function AmountInput({
  value,
  onChange,
  color,
  autoFocus,
  accessibilityLabel = "Amount",
  style,
}: AmountInputProps) {
  const { theme } = useAppTheme();

  return (
    <TextInput
      value={value > 0 ? formatCurrency(value) : ""}
      onChangeText={(text) => onChange(parseAmountInput(text))}
      placeholder={formatCurrency(0)}
      placeholderTextColor={theme.colors.secondaryText}
      keyboardType="number-pad"
      autoFocus={autoFocus}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.input,
        { color: color ?? theme.colors.text, borderBottomColor: theme.colors.border },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    fontSize: 34,
    fontWeight: "800",
    paddingVertical: 8,
    marginBottom: 24,
    borderBottomWidth: 1,
  },
});
