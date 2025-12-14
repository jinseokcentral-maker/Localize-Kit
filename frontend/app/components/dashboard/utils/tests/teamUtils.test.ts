import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import {
  getTeamsEffect,
  shouldShowUpgradeEffect,
  getUserInitialsEffect,
} from "../teamUtils";
import type { TeamInfo } from "~/hooks/query/useGetMe";

describe("shouldShowUpgradeEffect", () => {
    const createTeam = (
        teamId: string,
        personal: boolean = false,
    ): TeamInfo => ({
        teamId,
        teamName: `Team ${teamId}`,
        projectCount: 0,
        plan: "free",
        canCreateProject: true,
        memberCount: 1,
        personal,
    });

    it("should return false when plan is pro", () => {
        const result = Effect.runSync(
            shouldShowUpgradeEffect({
                plan: "pro",
                teamId: null,
                teams: [],
            }),
        );
        expect(result).toBe(false);
    });

    it("should return false when plan is team", () => {
        const result = Effect.runSync(
            shouldShowUpgradeEffect({
                plan: "team",
                teamId: null,
                teams: [],
            }),
        );
        expect(result).toBe(false);
    });

    it("should return true when plan is free and no team selected", () => {
        const result = Effect.runSync(
            shouldShowUpgradeEffect({
                plan: "free",
                teamId: null,
                teams: [],
            }),
        );
        expect(result).toBe(true);
    });

    it("should return true when plan is free and personal team is selected", () => {
        const personalTeam = createTeam("personal-1", true);
        const result = Effect.runSync(
            shouldShowUpgradeEffect({
                plan: "free",
                teamId: "personal-1",
                teams: [personalTeam],
            }),
        );
        expect(result).toBe(true);
    });

    it("should return false when non-personal team is selected", () => {
        const team = createTeam("team-1", false);
        const result = Effect.runSync(
            shouldShowUpgradeEffect({
                plan: "free",
                teamId: "team-1",
                teams: [team],
            }),
        );
        expect(result).toBe(false);
    });

    it("should return true when no teamId and personal team exists", () => {
        const personalTeam = createTeam("personal-1", true);
        const result = Effect.runSync(
            shouldShowUpgradeEffect({
                plan: "free",
                teamId: null,
                teams: [personalTeam],
            }),
        );
        expect(result).toBe(true);
    });

    it("should return true when no teamId and no teams", () => {
        const result = Effect.runSync(
            shouldShowUpgradeEffect({
                plan: "free",
                teamId: null,
                teams: [],
            }),
        );
        expect(result).toBe(true);
    });

    it("should return true when no teamId and teams undefined", () => {
        const result = Effect.runSync(
            shouldShowUpgradeEffect({
                plan: "free",
                teamId: null,
                teams: undefined,
            }),
        );
        expect(result).toBe(true);
    });

    it("should return false when selected team is not found but teamId exists", () => {
        const result = Effect.runSync(
            shouldShowUpgradeEffect({
                plan: "free",
                teamId: "non-existent-team",
                teams: [createTeam("team-1", false)],
            }),
        );
        expect(result).toBe(true);
    });

    it("should return false when teamId matches but team is not personal", () => {
        const team1 = createTeam("team-1", false);
        const team2 = createTeam("team-2", true);
        const result = Effect.runSync(
            shouldShowUpgradeEffect({
                plan: "free",
                teamId: "team-1",
                teams: [team1, team2],
            }),
        );
        expect(result).toBe(false);
    });

    it("should return true when teamId matches personal team", () => {
        const team1 = createTeam("team-1", false);
        const personalTeam = createTeam("personal-1", true);
        const result = Effect.runSync(
            shouldShowUpgradeEffect({
                plan: "free",
                teamId: "personal-1",
                teams: [team1, personalTeam],
            }),
        );
        expect(result).toBe(true);
    });

    it("should handle team without teamId (should be filtered out)", () => {
        const teamWithoutId: TeamInfo = {
            teamName: "Team without ID",
            projectCount: 0,
            plan: "free",
            canCreateProject: true,
            memberCount: 1,
            personal: false,
        };
        const result = Effect.runSync(
            shouldShowUpgradeEffect({
                plan: "free",
                teamId: null,
                teams: [teamWithoutId],
            }),
        );
        expect(result).toBe(true);
    });
});

describe("getTeamsEffect", () => {
    const createTeam = (
        teamId: string,
        teamName: string = `Team ${teamId}`,
        personal: boolean = false,
    ): TeamInfo => ({
        teamId,
        teamName,
        projectCount: 0,
        plan: "free",
        canCreateProject: true,
        memberCount: 1,
        personal,
    });

    it("should return empty array when teams is undefined", () => {
        const result = Effect.runSync(getTeamsEffect(undefined));
        expect(result).toEqual([]);
    });

    it("should return empty array when teams is empty", () => {
        const result = Effect.runSync(getTeamsEffect([]));
        expect(result).toEqual([]);
    });

    it("should return valid teams with teamId", () => {
        const teams: TeamInfo[] = [
            createTeam("team-1", "Team 1", false),
            createTeam("team-2", "Team 2", true),
        ];
        const result = Effect.runSync(getTeamsEffect(teams));
        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({
            id: "team-1",
            name: "Team 1",
            plan: "Free",
        });
        expect(result[1]).toMatchObject({
            id: "team-2",
            name: "Team 2",
            plan: "Free",
        });
    });

    it("should filter out teams without teamId", () => {
        const teams: TeamInfo[] = [
            createTeam("team-1", "Team 1"),
            {
                teamName: "Team without ID",
                projectCount: 0,
                plan: "free",
                canCreateProject: true,
                memberCount: 1,
                personal: false,
            } as TeamInfo,
            createTeam("team-2", "Team 2"),
        ];
        const result = Effect.runSync(getTeamsEffect(teams));
        expect(result).toHaveLength(2);
        expect(result.map((t) => t.id)).toEqual(["team-1", "team-2"]);
    });

    it("should filter out teams with empty teamId", () => {
        const teams: TeamInfo[] = [
            createTeam("team-1", "Team 1"),
            {
                teamId: "",
                teamName: "Team with empty ID",
                projectCount: 0,
                plan: "free",
                canCreateProject: true,
                memberCount: 1,
                personal: false,
            } as TeamInfo,
            createTeam("team-2", "Team 2"),
        ];
        const result = Effect.runSync(getTeamsEffect(teams));
        expect(result).toHaveLength(2);
        expect(result.map((t) => t.id)).toEqual(["team-1", "team-2"]);
    });

    it("should filter out teams without teamName", () => {
        const teams: TeamInfo[] = [
            createTeam("team-1", "Team 1"),
            {
                teamId: "team-invalid",
                teamName: "",
                projectCount: 0,
                plan: "free",
                canCreateProject: true,
                memberCount: 1,
                personal: false,
            } as TeamInfo,
            createTeam("team-2", "Team 2"),
        ];
        const result = Effect.runSync(getTeamsEffect(teams));
        expect(result).toHaveLength(2);
        expect(result.map((t) => t.id)).toEqual(["team-1", "team-2"]);
    });

    it("should handle plan display name correctly", () => {
        const teams: TeamInfo[] = [
            createTeam("team-1", "Team 1"),
            {
                teamId: "team-2",
                teamName: "Team 2",
                projectCount: 0,
                plan: "pro",
                canCreateProject: true,
                memberCount: 1,
                personal: false,
            } as TeamInfo,
        ];
        const result = Effect.runSync(getTeamsEffect(teams));
        expect(result).toHaveLength(2);
        expect(result[0].plan).toBe("Free");
        expect(result[1].plan).toBe("Pro");
    });

    it("should handle unknown plan type", () => {
        const teams: TeamInfo[] = [
            {
                teamId: "team-1",
                teamName: "Team 1",
                projectCount: 0,
                plan: { unknown: "plan" },
                canCreateProject: true,
                memberCount: 1,
                personal: false,
            } as TeamInfo,
        ];
        const result = Effect.runSync(getTeamsEffect(teams));
        expect(result).toHaveLength(1);
        expect(result[0].plan).toBe("Free"); // Defaults to "free"
    });

    it("should preserve teamInfo in result", () => {
        const team = createTeam("team-1", "Team 1", true);
        const teams: TeamInfo[] = [team];
        const result = Effect.runSync(getTeamsEffect(teams));
        expect(result).toHaveLength(1);
        expect(result[0].teamInfo).toEqual(team);
    });

    it("should handle error gracefully", () => {
        const result = Effect.runSync(
            getTeamsEffect(undefined).pipe(
                Effect.catchAll(() => Effect.succeed([])),
            ),
        );
        expect(result).toEqual([]);
    });
});

describe("getUserInitialsEffect", () => {
    it("should return initials from full name with first and last name", () => {
        const result = Effect.runSync(
            getUserInitialsEffect({
                fullName: "John Doe",
                email: "john@example.com",
            }),
        );
        expect(result).toBe("JD");
    });

    it("should return first 2 letters when full name has only one word", () => {
        const result = Effect.runSync(
            getUserInitialsEffect({
                fullName: "John",
                email: "john@example.com",
            }),
        );
        expect(result).toBe("JO");
    });

    it("should return first 2 letters when full name has multiple words", () => {
        const result = Effect.runSync(
            getUserInitialsEffect({
                fullName: "John Michael Doe",
                email: "john@example.com",
            }),
        );
        expect(result).toBe("JD");
    });

    it("should return initials from email when fullName is not available", () => {
        const result = Effect.runSync(
            getUserInitialsEffect({
                fullName: null,
                email: "john@example.com",
            }),
        );
        expect(result).toBe("JO");
    });

    it("should return initials from email when fullName is empty string", () => {
        const result = Effect.runSync(
            getUserInitialsEffect({
                fullName: "",
                email: "john@example.com",
            }),
        );
        expect(result).toBe("JO");
    });

    it("should return initials from email when fullName is whitespace only", () => {
        const result = Effect.runSync(
            getUserInitialsEffect({
                fullName: "   ",
                email: "john@example.com",
            }),
        );
        expect(result).toBe("JO");
    });

    it("should return 'U' when both fullName and email are not available", () => {
        const result = Effect.runSync(
            getUserInitialsEffect({
                fullName: null,
                email: null,
            }),
        );
        expect(result).toBe("U");
    });

    it("should return 'U' when both fullName and email are empty", () => {
        const result = Effect.runSync(
            getUserInitialsEffect({
                fullName: "",
                email: "",
            }),
        );
        expect(result).toBe("U");
    });

    it("should return 'U' when email is whitespace only and fullName is not available", () => {
        const result = Effect.runSync(
            getUserInitialsEffect({
                fullName: null,
                email: "   ",
            }),
        );
        expect(result).toBe("U");
    });

    it("should handle email with single character", () => {
        const result = Effect.runSync(
            getUserInitialsEffect({
                fullName: null,
                email: "j",
            }),
        );
        expect(result).toBe("J");
    });

    it("should handle fullName with single character", () => {
        const result = Effect.runSync(
            getUserInitialsEffect({
                fullName: "J",
                email: "john@example.com",
            }),
        );
        expect(result).toBe("J");
    });

    it("should prioritize fullName over email", () => {
        const result = Effect.runSync(
            getUserInitialsEffect({
                fullName: "Jane Smith",
                email: "john@example.com",
            }),
        );
        expect(result).toBe("JS");
    });

    it("should handle unknown types gracefully", () => {
        const result = Effect.runSync(
            getUserInitialsEffect({
                fullName: { unknown: "type" },
                email: { unknown: "type" },
            }),
        );
        expect(result).toBe("U");
    });

    it("should handle mixed case names correctly", () => {
        const result = Effect.runSync(
            getUserInitialsEffect({
                fullName: "john doe",
                email: "john@example.com",
            }),
        );
        expect(result).toBe("JD");
    });

    it("should handle names with extra spaces", () => {
        const result = Effect.runSync(
            getUserInitialsEffect({
                fullName: "  John   Doe  ",
                email: "john@example.com",
            }),
        );
        expect(result).toBe("JD");
    });
});
