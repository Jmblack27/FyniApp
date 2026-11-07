
import { useColorScheme } from "react-native";
import { darkTheme, lightTheme } from "../constants/theme";
import { useThemeStore } from "../store/storeTheme";

export function useAppTheme() {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((state) => state.mode);

  const resolvedMode =
    mode === "system"
      ? systemScheme ?? "light"
      : mode;

  return {
    theme:
      resolvedMode === "dark"
        ? darkTheme
        : lightTheme,
    isDark: resolvedMode === "dark",
    mode,
  };
}
