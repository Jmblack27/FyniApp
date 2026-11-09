export interface Savings {
  id: number;
  name: string;
  /** Optional target in whole COP */
  goal: number | null;
  /** Current amount in this savings (sum of movements), whole COP */
  saved: number;
  createdAt: number;
}

export type MovementKind = "deposit" | "withdraw";

export interface SavingsMovement {
  id: number;
  /** Positive = money added, negative = money withdrawn */
  amount: number;
  createdAt: number;
}

export interface GoalProgress {
  /** saved / goal, may exceed 1 */
  ratio: number;
  /** Still needed to reach the goal, never negative */
  remaining: number;
  reached: boolean;
}
