import { Effect } from "effect";
import { z } from "zod";
import type { TeamInfo } from "~/hooks/query/useGetMe";
import { getPlanDisplayName } from "~/pages/dashboard/utils/planUtils";

export interface GetUserInitialsParams {
  fullName: string | unknown;
  email: string | unknown;
}

export interface ShouldShowUpgradeParams {
  plan: string;
  teamId: string | null;
  teams?: TeamInfo[];
}

export interface TeamDisplay {
  id: string;
  name: string;
  plan: string;
  teamInfo: TeamInfo;
}

// Zod schema for validating team data
const teamInfoSchema = z.object({
  teamId: z.string().min(1, "teamId is required"),
  teamName: z.string().min(1, "teamName is required"),
  plan: z.union([z.string(), z.unknown()]).optional(),
  projectCount: z.number(),
  canCreateProject: z.boolean(),
  memberCount: z.number(),
  avatarUrl: z.union([z.string(), z.unknown()]).optional(),
  personal: z.boolean(),
});

/**
 * Get teams from userData with validation
 * Filters out teams without valid teamId
 */
export function getTeamsEffect(
  teams: TeamInfo[] | undefined,
): Effect.Effect<TeamDisplay[], Error> {
  return Effect.sync(() => {
    if (!teams || teams.length === 0) {
      return [];
    }

    const validTeams: TeamDisplay[] = [];

    for (const teamInfo of teams) {
      // Validate team data with zod
      const validationResult = teamInfoSchema.safeParse(teamInfo);

      if (!validationResult.success) {
        // Skip invalid teams (missing teamId or other required fields)
        continue;
      }

      const validTeam = validationResult.data;

      validTeams.push({
        id: validTeam.teamId,
        name: validTeam.teamName,
        plan: getPlanDisplayName(
          typeof validTeam.plan === "string" ? validTeam.plan : "free",
        ),
        teamInfo,
      });
    }

    return validTeams;
  });
}

/**
 * Get user initials from name or email
 * Returns first letter of first and last name if available,
 * otherwise first 2 letters of name or email
 */
export function getUserInitialsEffect(
  params: GetUserInitialsParams,
): Effect.Effect<string, never> {
  return Effect.sync(() => {
    const { fullName, email } = params;

    if (typeof fullName === "string" && fullName.trim()) {
      const parts = fullName.trim().split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return fullName.substring(0, 2).toUpperCase();
    }
    if (typeof email === "string" && email.trim()) {
      return email.substring(0, 2).toUpperCase();
    }
    return "U";
  });
}

/**
 * Determine if "Upgrade to Pro" button should be shown
 * Hide if: selected team is not personal OR plan is pro/team
 */
export function shouldShowUpgradeEffect(
  params: ShouldShowUpgradeParams,
): Effect.Effect<boolean, never> {
  return Effect.sync(() => {
    const { plan, teamId, teams } = params;

    // If plan is pro or team, don't show upgrade
    if (plan === "pro" || plan === "team") {
      return false;
    }

    // If a team is selected, check if it's personal
    if (teamId && teams) {
      const selectedTeam = teams.find((team) => {
        // Use teamId (required)
        const teamIdentifier =
          typeof team.teamId === "string" && team.teamId ? team.teamId : "";
        return teamIdentifier === teamId;
      });

      // If selected team exists and is not personal, don't show upgrade
      if (selectedTeam && selectedTeam.personal !== true) {
        return false;
      }
    }

    // If no teamId, check if personal team exists and is selected
    if (!teamId && teams) {
      const personalTeam = teams.find((team) => team.personal === true);
      // If personal team exists, show upgrade (it's the default)
      // If no personal team, show upgrade
      return true;
    }

    return true;
  });
}

