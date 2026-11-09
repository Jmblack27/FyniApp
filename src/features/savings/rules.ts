import { formatCurrency } from "../../utils/formatCurrency";
import type { GoalProgress, MovementKind } from "./types";

export const MAX_NAME_LENGTH = 40;

export function goalProgress(saved: number, goal: number | null): GoalProgress | null {
  if (goal === null || goal <= 0) return null;
  return {
    ratio: saved / goal,
    remaining: Math.max(goal - saved, 0),
    reached: saved >= goal,
  };
}

/** Trimmed name, or an error message when it can't be saved. */
export function validateName(raw: string): { name: string } | { error: string } {
  const name = raw.trim().replace(/\s+/g, " ");
  if (!name) return { error: "Give your savings a name." };
  if (name.length > MAX_NAME_LENGTH) {
    return { error: `Use at most ${MAX_NAME_LENGTH} characters.` };
  }
  return { name };
}

/**
 * Money moved into savings leaves the available balance, so a deposit can't
 * exceed it; a withdrawal can't exceed what this savings holds.
 * Returns an error message, or null when the movement is allowed.
 */
export function validateMovement(
  kind: MovementKind,
  amount: number,
  limits: { available: number; saved: number },
): string | null {
  if (!Number.isInteger(amount) || amount <= 0) return "Enter an amount.";
  if (kind === "deposit" && amount > limits.available) {
    return limits.available > 0
      ? `You only have ${formatCurrency(limits.available)} available.`
      : "You don't have money available to save.";
  }
  if (kind === "withdraw" && amount > limits.saved) {
    return `This savings only has ${formatCurrency(limits.saved)}.`;
  }
  return null;
}
