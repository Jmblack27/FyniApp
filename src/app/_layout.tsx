import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";

import { DATABASE_NAME, migrateDbIfNeeded } from "../db/migrations";
import { useAppTheme } from "../hooks/useApppTheme";

export default function RootLayout() {
  const { theme, isDark } = useAppTheme();

  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="add-transaction"
          options={{ presentation: "modal" }}
        />
      </Stack>
    </SQLiteProvider>
  );
}
