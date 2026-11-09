# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Read [AGENTS.md](AGENTS.md) first.** It holds the Expo rules for this repo: check the versioned docs before touching any Expo or React Native API, add packages with `npx expo install`, never edit `ios/`/`android/` by hand, use Expo Router, and build with EAS.

## Project

FYNI is a personal finance app. UI text is in **English** (dates use `en-US`). Amounts are whole Colombian pesos (COP) stored as integers and displayed with `es-CO` formatting; see `src/utils/formatCurrency.ts`. It runs on Expo SDK 58, React Native 0.88, React 19.3 and TypeScript 6, with the React Compiler and typed routes turned on in `app.json`. It uses npm (`package-lock.json`), not bun.

## Commands

```bash
npx expo start            # dev server (uses expo-dev-client, so you need a dev build, not Expo Go)
npx expo lint             # lint (also: npm run lint)
npx tsc --noEmit          # typecheck
npx eas-cli@latest build --profile development   # dev client build (profiles: development, preview, production in eas.json)
```

There's no test runner set up yet, so there's no Jest config and there are no tests.

## Architecture

- **Routing**: `src/app/_layout.tsx` wraps everything in `<SQLiteProvider>` and renders a header-less `Stack`. `index.tsx` is the dashboard. `add-transaction.tsx` is a modal that takes a `type` param (`INCOME`/`EXPENSE`). `budgets.tsx`, `savings/index.tsx` and `savings/[id].tsx` are pushed screens. `edit-budget.tsx`, `savings-form.tsx` (create, or edit with an `id` param) and `savings-move.tsx` (`id` + `kind` = `deposit`/`withdraw`) are modals. Screens draw their own headers. Web output is `server` mode with async routes on web.
- **Database**: `src/db/migrations.ts` runs as `SQLiteProvider`'s `onInit` and versions the schema with `PRAGMA user_version`. To change the schema, add a new `if (version < N)` block and bump `DATABASE_VERSION`; never edit existing blocks, because installed apps have already run them. Screens get the database through `useSQLiteContext()`. `PRAGMA foreign_keys = ON` runs on every open, before the version check.
- **Theme system** (a custom one that replaced the Expo template's):
  - `src/constants/theme.ts` exports `lightTheme` / `darkTheme`, each with a `colors` object (background, surface, primary, text, secondaryText, border, income, expense, iconBackground, …).
  - `src/store/storeTheme.ts` is a Zustand store holding `mode: "light" | "dark" | "system"`. It's saved with `persist` through the sync API of `expo-sqlite/kv-store`, so it loads before the first render. On web, `expo-sqlite` also needs Metro configured for `.wasm` files plus COOP/COEP headers (see the SDK 58 sqlite docs). Neither is set up yet.
  - `src/hooks/useApppTheme.ts` (note the triple "p" in the filename) exports `useAppTheme()`. It resolves `system` through `useColorScheme()` and returns `{ theme, isDark, mode }`. Screens build their styles with a `createStyles(theme.colors)` function.
- **Transactions** (`src/features/transactions/`):
  - `repository.ts` holds all SQL as plain functions that take the database as the first argument; screens never write SQL inline.
  - `categories.ts` lists the fixed income and expense categories. The category `id` is stored in the database, so ids must never be renamed or removed. Icons come from the category, not from the row.
  - `useDashboardData()` reloads the summary and recent list through `useFocusEffect`, which is how the dashboard refreshes after the add modal closes.
  - The project deliberately has **no mock or sample data**. Don't add any.
- **Budgets** (`src/features/budgets/`):
  - Each expense category can have one recurring monthly limit (`budgets` table, schema v2, keyed by category id). Spending is summed per calendar month in local time (`src/utils/month.ts`: `start` inclusive, `end` exclusive).
  - `overview.ts` holds the pure rules: `budgetStatus` is `ok` below 80%, `warning` from 80% up to the limit, and `over` above it. `buildBudgetOverview` merges stored limits with monthly spending and lists budgeted categories first, most at risk first. Keep business rules here, free of database and React, rather than in screens.
  - `useBudgetOverview()` reloads on focus, like `useDashboardData()`. The dashboard card and `budgets.tsx` both use it. `edit-budget.tsx` is a modal that takes a `category` param.
- **Balance and savings**:
  - **Available balance = income − expenses − money in savings.** `getBalance()` in `src/features/balance/repository.ts` is the only place that computes it. The dashboard and the add-money check both use it, so don't recompute it elsewhere. `TransactionSummary` deliberately has no `balance` field.
  - Savings (`src/features/savings/`, schema v3) are named items with an optional `goal`. Money moves through `savings_movements` (positive = added, negative = withdrawn). An item's current amount is the sum of its movements; it isn't stored. Savings movements are neither income nor expenses, so they don't affect budgets or the income/expense totals.
  - `rules.ts` holds the pure rules: you can't add more than the available balance or withdraw more than an item holds; plus name validation and goal progress. `moveMoney()` checks these again inside a database transaction. Deleting a savings item deletes its movements, so its money returns to the available balance.
- **Shared components** (`src/components/`): `AmountInput` (formatted COP field and `parseAmountInput`) and `ProgressBar`. Use these instead of rebuilding amount fields or bars per screen.
- **Path alias**: `@/*` maps to `src/*` and `@/assets/*` maps to `assets/*`. The newer code uses relative imports instead.
- **Component styling**: shared components get their colours from `useAppTheme()`. Don't bring back the old Expo template's `Colors`/`ThemedText` system.
