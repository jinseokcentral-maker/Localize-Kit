/**
 * Project API response mapper utilities
 * Maps API response to Project type
 */
import { Effect } from "effect";
import dayjs from "dayjs";
import type { ProjectListProjectsResponse } from "~/api/types.gen";
import type { Project } from "~/types/dashboard";

/**
 * Map API project item to Project type
 */
function mapApiProjectToProject(
    apiProject: ProjectListProjectsResponse["items"][0],
): Effect.Effect<Project, Error> {
    return Effect.sync(() => {
        // Extract languages array
        let languages = Array.isArray(apiProject.languages)
            ? apiProject.languages.filter(
                (lang): lang is string => typeof lang === "string",
            )
            : [];

        // Extract default language
        const defaultLanguage = typeof apiProject.defaultLanguage === "string"
            ? apiProject.defaultLanguage
            : languages[0] || "en";

        // If languages array is empty but defaultLanguage exists, add it to languages
        if (languages.length === 0 && defaultLanguage) {
            languages = [defaultLanguage];
        }

        // Extract description
        const description = typeof apiProject.description === "string"
            ? apiProject.description
            : "";

        // Extract dates
        const createdAt = typeof apiProject.createdAt === "string"
            ? apiProject.createdAt
            : dayjs().toISOString();

        const updatedAt = typeof apiProject.updatedAt === "string"
            ? apiProject.updatedAt
            : createdAt;

        // Extract archived status
        const archived = typeof apiProject.archived === "boolean"
            ? apiProject.archived
            : false;
        const status: Project["status"] = archived ? "archived" : "active";

        return {
            id: apiProject.id,
            name: apiProject.name,
            description,
            type: "Other", // API doesn't provide type, default to "Other"
            sourceLang: defaultLanguage.toUpperCase(),
            targetLangs: languages
                .filter((lang) => lang !== defaultLanguage)
                .map((lang) => lang.toUpperCase()),
            totalKeys: 0, // API doesn't provide this
            progress: 0, // API doesn't provide this
            updatedAt,
            status,
            slug: apiProject.slug,
            defaultLanguage: defaultLanguage.toUpperCase(),
            languages: languages.map((lang) => lang.toUpperCase()),
            createdAt,
        } satisfies Project;
    });
}

/**
 * Map API response to Project array
 */
export function mapApiProjectsResponse(
    response: ProjectListProjectsResponse,
): Effect.Effect<Project[], Error> {
    return Effect.gen(function* (_) {
        const projects: Project[] = [];
        for (const apiProject of response.items) {
            const project = yield* _(mapApiProjectToProject(apiProject));
            projects.push(project);
        }
        return projects;
    });
}
