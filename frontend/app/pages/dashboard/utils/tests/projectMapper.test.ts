import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { mapApiProjectsResponse } from "../projectMapper";
import type { ProjectListProjectsResponse } from "~/api/types.gen";

describe("projectMapper", () => {
  describe("mapApiProjectsResponse", () => {
    it("should map API response to Project array", () => {
      const apiResponse: ProjectListProjectsResponse = {
        items: [
          {
            id: "1",
            name: "Test Project",
            description: "Test description",
            languages: ["en", "ko", "ja"],
            defaultLanguage: "en",
            slug: "test-project",
            ownerId: "user-1",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-02T00:00:00Z",
          },
        ],
        meta: {
          index: 0,
          pageSize: 15,
          hasNext: false,
          totalCount: 1,
          totalPageCount: 1,
        },
      };

      const result = Effect.runSync(mapApiProjectsResponse(apiResponse));

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "1",
        name: "Test Project",
        description: "Test description",
        defaultLanguage: "EN",
        languages: ["EN", "KO", "JA"],
        slug: "test-project",
        status: "active",
      });
    });

    it("should handle empty languages array", () => {
      const apiResponse: ProjectListProjectsResponse = {
        items: [
          {
            id: "1",
            name: "Test Project",
            description: "Test description",
            languages: [],
            defaultLanguage: "en",
            slug: "test-project",
            ownerId: "user-1",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-02T00:00:00Z",
          },
        ],
        meta: {
          index: 0,
          pageSize: 15,
          hasNext: false,
          totalCount: 1,
          totalPageCount: 1,
        },
      };

      const result = Effect.runSync(mapApiProjectsResponse(apiResponse));

      expect(result[0].languages).toEqual(["EN"]);
      expect(result[0].defaultLanguage).toBe("EN");
    });

    it("should filter out non-string languages", () => {
      const apiResponse: ProjectListProjectsResponse = {
        items: [
          {
            id: "1",
            name: "Test Project",
            description: "Test description",
            languages: ["en", 123, "ko", null, "ja"] as unknown as string[],
            defaultLanguage: "en",
            slug: "test-project",
            ownerId: "user-1",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-02T00:00:00Z",
          },
        ],
        meta: {
          index: 0,
          pageSize: 15,
          hasNext: false,
          totalCount: 1,
          totalPageCount: 1,
        },
      };

      const result = Effect.runSync(mapApiProjectsResponse(apiResponse));

      expect(result[0].languages).toEqual(["EN", "KO", "JA"]);
    });

    it("should handle multiple projects", () => {
      const apiResponse: ProjectListProjectsResponse = {
        items: [
          {
            id: "1",
            name: "Project 1",
            description: "Description 1",
            languages: ["en"],
            defaultLanguage: "en",
            slug: "project-1",
            ownerId: "user-1",
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-02T00:00:00Z",
          },
          {
            id: "2",
            name: "Project 2",
            description: "Description 2",
            languages: ["ko", "ja"],
            defaultLanguage: "ko",
            slug: "project-2",
            ownerId: "user-2",
            createdAt: "2024-01-03T00:00:00Z",
            updatedAt: "2024-01-04T00:00:00Z",
          },
        ],
        meta: {
          index: 0,
          pageSize: 15,
          hasNext: false,
          totalCount: 2,
          totalPageCount: 1,
        },
      };

      const result = Effect.runSync(mapApiProjectsResponse(apiResponse));

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Project 1");
      expect(result[1].name).toBe("Project 2");
    });
  });
});

