import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAppTheme } from "../hooks/useApppTheme";

export default function RootLayout() {
  const { isDark } = useAppTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDark ? "#101820" : "#F5F7FA",
          },
        }}
      />
    </>
  );
}
