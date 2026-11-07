import type { SQLiteStorage } from "expo-sqlite/kv-store";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

// expo-sqlite needs native code. If the installed binary was built without it
// (Expo Go, or a dev build older than the dependency), importing it throws at
// module load and takes the whole app down. Load it lazily and fall back to
// in-memory storage so the app still runs; the theme just won't persist.
function createThemeStorage(): StateStorage {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- must be lazy to catch a missing native module
    const kv: SQLiteStorage = require("expo-sqlite/kv-store").default;
    // Sync methods let zustand hydrate before the first render, so the saved
    // theme is applied immediately instead of flashing the default on launch.
    return {
      getItem: (name) => kv.getItemSync(name),
      setItem: (name, value) => kv.setItemSync(name, value),
      removeItem: (name) => {
        kv.removeItemSync(name);
      },
    };
  } catch (error) {
    if (__DEV__) {
      console.warn(
        "[storeTheme] expo-sqlite native module unavailable; theme will not persist. " +
          "Rebuild the dev client (npx expo run:android / eas build --profile development).",
        error
      );
    }
    const memory = new Map<string, string>();
    return {
      getItem: (name) => memory.get(name) ?? null,
      setItem: (name, value) => {
        memory.set(name, value);
      },
      removeItem: (name) => {
        memory.delete(name);
      },
    };
  }
}

const storage = createThemeStorage();

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "system",

      setMode: (mode) => set({ mode }),

      toggleTheme: () =>
        set((state) => ({
          mode: state.mode === "dark" ? "light" : "dark",
        })),
    }),
    {
      name: "fyni-theme",
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);
