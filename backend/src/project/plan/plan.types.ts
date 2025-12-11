export const PLAN_LIMITS = {
  free: 1,
  pro: 10,
  team: Infinity,
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;

