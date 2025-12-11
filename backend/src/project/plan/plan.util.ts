import { PLAN_LIMITS, type PlanName } from './plan.types';

export type { PlanName };

export function getProjectLimit(plan: PlanName): number {
  return PLAN_LIMITS[plan];
}

export function canCreateProject(plan: PlanName, currentCount: number): boolean {
  const limit = getProjectLimit(plan);
  if (!Number.isFinite(limit)) {
    return true;
  }
  return currentCount < limit;
}

