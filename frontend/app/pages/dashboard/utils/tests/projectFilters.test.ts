/**
 * Unit tests for project filtering and sorting utilities
 */

import { describe, expect, it } from "vitest";
import {
  filterProjectsBySearch,
  filterProjectsByStatus,
  sortProjects,
  filterAndSortProjects,
} from "../projectFilters";
import type { Project } from "~/types/dashboard";

const mockProjects: Project[] = [
  {
    id: "1",
    name: "Marketing Landing Page",
    description: "Main website localization project",
    type: "Next.js",
    sourceLang: "EN",
    targetLangs: ["KR", "JP", "CN"],
    totalKeys: 1240,
    progress: 98,
    updatedAt: "2 hours ago",
    status: "active",
    apiUsage: 12500,
    apiLimit: 50000,
    slug: "marketing-landing",
    defaultLanguage: "EN",
    languages: ["EN", "KR", "JP", "CN"],
    createdAt: new Date("2024-01-15").toISOString(),
  },
  {
    id: "2",
    name: "Admin Dashboard",
    description: "Internal administration tools",
    type: "React",
    sourceLang: "EN",
    targetLangs: ["KR", "DE"],
    totalKeys: 856,
    progress: 45,
    updatedAt: "1 day ago",
    status: "active",
    apiUsage: 2100,
    apiLimit: 50000,
    slug: "admin-dashboard",
    defaultLanguage: "EN",
    languages: ["EN", "KR", "DE"],
    createdAt: new Date("2024-01-10").toISOString(),
  },
  {
    id: "3",
    name: "Mobile App",
    description: "React Native mobile application",
    type: "React Native",
    sourceLang: "EN",
    targetLangs: ["KR", "ES", "FR"],
    totalKeys: 3420,
    progress: 82,
    updatedAt: "3 days ago",
    status: "warning",
    apiUsage: 30500,
    apiLimit: 50000,
    slug: "mobile-app",
    defaultLanguage: "EN",
    languages: ["EN", "KR", "ES", "FR"],
    createdAt: new Date("2024-01-20").toISOString(),
  },
];

describe("filterProjectsBySearch", () => {
  it("should return all projects when search query is empty", () => {
    const result = filterProjectsBySearch(mockProjects, "");
    expect(result).toEqual(mockProjects);
  });

  it("should filter by project name", () => {
    const result = filterProjectsBySearch(mockProjects, "Marketing");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Marketing Landing Page");
  });

  it("should filter by description", () => {
    const result = filterProjectsBySearch(mockProjects, "administration");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Admin Dashboard");
  });

  it("should filter by type", () => {
    const result = filterProjectsBySearch(mockProjects, "React Native");
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("React Native");
  });

  it("should filter by target languages", () => {
    const result = filterProjectsBySearch(mockProjects, "DE");
    expect(result).toHaveLength(1);
    expect(result[0].targetLangs).toContain("DE");
  });

  it("should be case-insensitive", () => {
    const result = filterProjectsBySearch(mockProjects, "marketing");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Marketing Landing Page");
  });

  it("should return empty array when no match found", () => {
    const result = filterProjectsBySearch(mockProjects, "NonExistent");
    expect(result).toEqual([]);
  });
});

describe("filterProjectsByStatus", () => {
  it("should return all projects when filter is 'all'", () => {
    const result = filterProjectsByStatus(mockProjects, "all");
    expect(result).toEqual(mockProjects);
  });

  it("should filter by active status", () => {
    const result = filterProjectsByStatus(mockProjects, "active");
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.status === "active")).toBe(true);
  });

  it("should filter by warning status", () => {
    const result = filterProjectsByStatus(mockProjects, "warning");
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("warning");
  });

  it("should return empty array when no projects match status", () => {
    const result = filterProjectsByStatus(mockProjects, "archived");
    expect(result).toEqual([]);
  });
});

describe("sortProjects", () => {
  it("should sort by newest first", () => {
    const result = sortProjects(mockProjects, "newest");
    expect(result[0].createdAt).toBe(mockProjects[2].createdAt); // Mobile App (2024-01-20)
    expect(result[result.length - 1].createdAt).toBe(
      mockProjects[1].createdAt,
    ); // Admin Dashboard (2024-01-10)
  });

  it("should sort by oldest first", () => {
    const result = sortProjects(mockProjects, "oldest");
    expect(result[0].createdAt).toBe(mockProjects[1].createdAt); // Admin Dashboard (2024-01-10)
    expect(result[result.length - 1].createdAt).toBe(
      mockProjects[2].createdAt,
    ); // Mobile App (2024-01-20)
  });

  it("should sort by name ascending", () => {
    const result = sortProjects(mockProjects, "name-asc");
    expect(result[0].name).toBe("Admin Dashboard");
    expect(result[result.length - 1].name).toBe("Mobile App");
  });

  it("should sort by name descending", () => {
    const result = sortProjects(mockProjects, "name-desc");
    expect(result[0].name).toBe("Mobile App");
    expect(result[result.length - 1].name).toBe("Admin Dashboard");
  });

  it("should handle empty array", () => {
    const result = sortProjects([], "newest");
    expect(result).toEqual([]);
  });
});

describe("filterAndSortProjects", () => {
  it("should filter and sort projects correctly", () => {
    const result = filterAndSortProjects(mockProjects, {
      searchQuery: "React",
      filterStatus: "active",
      sortOption: "name-asc",
    });

    // Should filter to active React projects and sort by name
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Admin Dashboard");
    expect(result[0].type).toBe("React");
    expect(result[0].status).toBe("active");
  });

  it("should apply search filter only", () => {
    const result = filterAndSortProjects(mockProjects, {
      searchQuery: "Mobile",
      filterStatus: "all",
      sortOption: "newest",
    });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Mobile App");
  });

  it("should apply status filter only", () => {
    const result = filterAndSortProjects(mockProjects, {
      searchQuery: "",
      filterStatus: "warning",
      sortOption: "newest",
    });

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("warning");
  });

  it("should apply all filters and sorting", () => {
    const result = filterAndSortProjects(mockProjects, {
      searchQuery: "a",
      filterStatus: "active",
      sortOption: "newest",
    });

    // Should find "Marketing" and "Admin" (both contain 'a'), filter to active, sort by newest
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.status === "active")).toBe(true);
  });
});

