import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Effect } from "effect";
import { apiClient } from "~/lib/api/authClient";
import { projectControllerCreateProject } from "~/api";
import { extractApiData, preserveError } from "~/lib/api/apiWrapper";
import type { CreateProjectDto, ProjectDto } from "~/api/types.gen";

/**
 * Effect-based API call for creating a project
 */
function createProjectEffect(
    input: CreateProjectDto,
): Effect.Effect<ProjectDto, Error> {
    return Effect.tryPromise({
        try: async () => {
            const { data } = await projectControllerCreateProject({
                client: apiClient,
                body: input,
                throwOnError: true,
            });
            return extractApiData<ProjectDto>(data);
        },
        catch: (err) => preserveError(err, "Failed to create project"),
    });
}

/**
 * Hook to create a project
 * Uses TanStack Query's useMutation with Effect pattern
 */
export function useCreateProject() {
    return useMutation({
        mutationFn: async (input: CreateProjectDto) => {
            return Effect.runPromise(
                createProjectEffect(input).pipe(
                    Effect.catchAll((err) => {
                        // Re-throw error so TanStack Query can handle it
                        return Effect.fail(err);
                    }),
                ),
            );
        },
    });
}
