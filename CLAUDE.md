# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Read [AGENTS.md](AGENTS.md) first.** It holds the Expo rules for this repo: check the versioned docs before touching any Expo or React Native API, add packages with `npx expo install`, never edit `ios/`/`android/` by hand, use Expo Router, and build with EAS.

## Project

FYNI is a personal finance app for Spanish-speaking users in Colombia. UI text is in Spanish and amounts are in COP (`es-CO`); see `src/utils/formatCurrency.ts`. It runs on Expo SDK 58, React Native 0.88, React 19.3 and TypeScript 6, with the React Compiler and typed routes turned on in `app.json`. It uses npm (`package-lock.json`), not bun.

## Commands

```bash
npx expo start            # dev server (uses expo-dev-client, so you need a dev build, not Expo Go)
npx expo lint             # lint (also: npm run lint)
npx tsc --noEmit          # typecheck
npx eas-cli@latest build --profile development   # dev client build (profiles: development, preview, production in eas.json)
```

There's no test runner set up yet, so there's no Jest config and there are no tests.

## Architecture

- **Routing**: `src/app/_layout.tsx` is a header-less `Stack` that sets the StatusBar style and screen background from the theme. `src/app/index.tsx` is the dashboard, currently the only screen. Web output is `server` mode with async routes on web.
- **Theme system** (a custom one that replaced the Expo template's):
  - `src/constants/theme.ts` exports `lightTheme` / `darkTheme`, each with a `colors` object (background, surface, primary, text, secondaryText, border, income, expense, iconBackground, …).
  - `src/store/storeTheme.ts` is a Zustand store holding `mode: "light" | "dark" | "system"`. It's saved with `persist` through the sync API of `expo-sqlite/kv-store`, so it loads before the first render. On web, `expo-sqlite` also needs Metro configured for `.wasm` files plus COOP/COEP headers (see the SDK 58 sqlite docs). Neither is set up yet.
  - `src/hooks/useApppTheme.ts` (note the triple "p" in the filename) exports `useAppTheme()`. It resolves `system` through `useColorScheme()` and returns `{ theme, isDark, mode }`. Screens build their styles with a `createStyles(theme.colors)` function.
- **Features**: domain code lives in `src/features/<feature>/`. `src/features/transactions/types.ts` defines the `Transaction` type (`type: "INCOME" | "EXPENSE"`, Ionicons icon name). The project deliberately has **no mock data**. The dashboard reads an empty `transactions` array and shows an empty state until real transaction storage is built (`expo-sqlite` is the intended backend). Don't add fake or sample data.
- **Path alias**: `@/*` maps to `src/*` and `@/assets/*` maps to `assets/*`. The newer code uses relative imports instead.
- **Shared components**: the template's `src/components/` folder has been removed. New shared components should go in a fresh `src/components/` and get their colours from `useAppTheme()`. Don't bring back the template's `Colors`/`ThemedText` system.
