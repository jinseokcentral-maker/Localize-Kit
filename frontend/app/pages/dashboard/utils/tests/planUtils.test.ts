/**
 * Unit tests for plan utility functions
 */

import { describe, it, expect } from "vitest";
import {
  getProjectLimit,
  canCreateProject,
  getPlanDisplayName,
  getDisabledReason,
  type PlanName,
} from "../planUtils";

describe("planUtils", () => {
  describe("getProjectLimit", () => {
    it("should return 1 for free plan", () => {
      expect(getProjectLimit("free")).toBe(1);
    });

    it("should return 10 for pro plan", () => {
      expect(getProjectLimit("pro")).toBe(10);
    });

    it("should return Infinity for team plan", () => {
      expect(getProjectLimit("team")).toBe(Infinity);
    });
  });

  describe("canCreateProject", () => {
    describe("free plan", () => {
      it("should return true when current count is 0", () => {
        expect(canCreateProject("free", 0)).toBe(true);
      });

      it("should return false when current count equals limit (1)", () => {
        expect(canCreateProject("free", 1)).toBe(false);
      });

      it("should return false when current count exceeds limit", () => {
        expect(canCreateProject("free", 2)).toBe(false);
        expect(canCreateProject("free", 5)).toBe(false);
      });
    });

    describe("pro plan", () => {
      it("should return true when current count is less than limit", () => {
        expect(canCreateProject("pro", 0)).toBe(true);
        expect(canCreateProject("pro", 5)).toBe(true);
        expect(canCreateProject("pro", 9)).toBe(true);
      });

      it("should return false when current count equals limit (10)", () => {
        expect(canCreateProject("pro", 10)).toBe(false);
      });

      it("should return false when current count exceeds limit", () => {
        expect(canCreateProject("pro", 11)).toBe(false);
        expect(canCreateProject("pro", 20)).toBe(false);
      });
    });

    describe("team plan", () => {
      it("should return true for any count (unlimited)", () => {
        expect(canCreateProject("team", 0)).toBe(true);
        expect(canCreateProject("team", 10)).toBe(true);
        expect(canCreateProject("team", 100)).toBe(true);
        expect(canCreateProject("team", 1000)).toBe(true);
      });
    });

    describe("edge cases", () => {
      it("should handle negative count as 0", () => {
        expect(canCreateProject("free", -1)).toBe(true);
        expect(canCreateProject("pro", -5)).toBe(true);
      });
    });
  });

  describe("getPlanDisplayName", () => {
    it("should capitalize first letter of plan name", () => {
      expect(getPlanDisplayName("free")).toBe("Free");
      expect(getPlanDisplayName("pro")).toBe("Pro");
      expect(getPlanDisplayName("team")).toBe("Team");
    });

    it("should return 'Free' as default for invalid input", () => {
      expect(getPlanDisplayName(null)).toBe("Free");
      expect(getPlanDisplayName(undefined)).toBe("Free");
      expect(getPlanDisplayName(123)).toBe("Free");
      expect(getPlanDisplayName({})).toBe("Free");
    });

    it("should handle empty string", () => {
      expect(getPlanDisplayName("")).toBe("");
    });

    it("should handle single character", () => {
      expect(getPlanDisplayName("a")).toBe("A");
    });
  });

  describe("getDisabledReason", () => {
    describe("free plan", () => {
      it("should return null when can create project", () => {
        expect(getDisabledReason("free", 0)).toBeNull();
      });

      it("should return message when limit reached", () => {
        const reason = getDisabledReason("free", 1);
        expect(reason).toBe(
          "Free plan allows only 1 project. Upgrade to Pro to create more projects.",
        );
      });

      it("should return message when limit exceeded", () => {
        const reason = getDisabledReason("free", 2);
        expect(reason).toContain("Free plan allows only 1 project");
        expect(reason).toContain("Upgrade to Pro");
      });
    });

    describe("pro plan", () => {
      it("should return null when can create project", () => {
        expect(getDisabledReason("pro", 0)).toBeNull();
        expect(getDisabledReason("pro", 5)).toBeNull();
        expect(getDisabledReason("pro", 9)).toBeNull();
      });

      it("should return message when limit reached", () => {
        const reason = getDisabledReason("pro", 10);
        expect(reason).toBe(
          "Pro plan allows 10 projects. You've reached the limit. Upgrade to Team for unlimited projects.",
        );
      });

      it("should return message when limit exceeded", () => {
        const reason = getDisabledReason("pro", 15);
        expect(reason).toContain("Pro plan allows 10 projects");
        expect(reason).toContain("Upgrade to Team");
      });
    });

    describe("team plan", () => {
      it("should always return null (unlimited)", () => {
        expect(getDisabledReason("team", 0)).toBeNull();
        expect(getDisabledReason("team", 10)).toBeNull();
        expect(getDisabledReason("team", 100)).toBeNull();
        expect(getDisabledReason("team", 1000)).toBeNull();
      });
    });

    describe("integration with canCreateProject", () => {
      it("should return null when canCreateProject returns true", () => {
        const plans: PlanName[] = ["free", "pro", "team"];
        plans.forEach((plan) => {
          const limit = getProjectLimit(plan);
          if (Number.isFinite(limit)) {
            expect(getDisabledReason(plan, limit - 1)).toBeNull();
          } else {
            expect(getDisabledReason(plan, 999)).toBeNull();
          }
        });
      });

      it("should return message when canCreateProject returns false", () => {
        expect(getDisabledReason("free", 1)).not.toBeNull();
        expect(getDisabledReason("pro", 10)).not.toBeNull();
      });
    });
  });
});

