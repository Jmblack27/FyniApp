import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

import type { TransactionType } from "./types";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export interface Category {
  id: string;
  label: string;
  icon: IconName;
}

// Ids are stored in the database. Labels and icons can change freely, but an
// id must never be renamed or removed once rows may reference it.
export const CATEGORIES: Record<TransactionType, Category[]> = {
  INCOME: [
    { id: "salary", label: "Salary", icon: "briefcase-outline" },
    { id: "freelance", label: "Freelance", icon: "laptop-outline" },
    { id: "investments", label: "Investments", icon: "trending-up-outline" },
    { id: "gift", label: "Gift", icon: "gift-outline" },
    { id: "other-income", label: "Other", icon: "ellipsis-horizontal-circle-outline" },
  ],
  EXPENSE: [
    { id: "groceries", label: "Groceries", icon: "cart-outline" },
    { id: "food", label: "Food & Dining", icon: "fast-food-outline" },
    { id: "transport", label: "Transport", icon: "car-outline" },
    { id: "housing", label: "Housing", icon: "home-outline" },
    { id: "bills", label: "Bills & Utilities", icon: "receipt-outline" },
    { id: "health", label: "Health", icon: "medkit-outline" },
    { id: "shopping", label: "Shopping", icon: "bag-handle-outline" },
    { id: "entertainment", label: "Entertainment", icon: "game-controller-outline" },
    { id: "education", label: "Education", icon: "school-outline" },
    { id: "other-expense", label: "Other", icon: "ellipsis-horizontal-circle-outline" },
  ],
};

const FALLBACK: Category = {
  id: "unknown",
  label: "Other",
  icon: "ellipsis-horizontal-circle-outline",
};

const BY_ID = new Map(
  [...CATEGORIES.INCOME, ...CATEGORIES.EXPENSE].map((c) => [c.id, c])
);

export function getCategory(id: string): Category {
  return BY_ID.get(id) ?? FALLBACK;
}
