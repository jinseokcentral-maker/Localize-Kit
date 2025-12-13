/**
 * Plan utility functions for project limits
 */

export type PlanName = "free" | "pro" | "team";

export const PLAN_LIMITS: Record<PlanName, number> = {
    free: 1,
    pro: 10,
    team: Infinity,
} as const;

/**
 * Get project limit for a plan
 */
export function getProjectLimit(plan: PlanName): number {
    return PLAN_LIMITS[plan];
}

/**
 * Check if user can create a project based on plan and current count
 */
export function canCreateProject(
    plan: PlanName,
    currentCount: number,
): boolean {
    const limit = getProjectLimit(plan);
    if (!Number.isFinite(limit)) {
        return true; // Infinity = unlimited
    }
    return currentCount < limit;
}

/**
 * Get plan display name
 */
export function getPlanDisplayName(plan: string | unknown): string {
    if (typeof plan === "string") {
        return plan.charAt(0).toUpperCase() + plan.slice(1);
    }
    return "Free";
}

/**
 * Get disabled reason for Create Project button
 */
export function getDisabledReason(
    plan: PlanName,
    currentCount: number,
): string | null {
    if (canCreateProject(plan, currentCount)) {
        return null;
    }

    const limit = getProjectLimit(plan);
    if (plan === "free") {
        return `Free plan allows only ${limit} project. Upgrade to Pro to create more projects.`;
    }
    if (plan === "pro") {
        return `Pro plan allows ${limit} projects. You've reached the limit. Upgrade to Team for unlimited projects.`;
    }
    return null; // Team plan has no limit
}
