import { useQuery } from "@tanstack/react-query";
import { Effect } from "effect";
import { apiClient } from "~/api/authClient";
import { projectControllerListProjects } from "~/api";
import type { ProjectControllerListProjectsResponse } from "~/api/types.gen";

/**
 * Effect-based API call for listing projects
 */
function listProjectsEffect(): Effect.Effect<
  ProjectControllerListProjectsResponse,
  Error
> {
  return Effect.tryPromise({
    try: async () => {
      const { data } = await projectControllerListProjects({
        client: apiClient,
        throwOnError: true,
      });
      return data;
    },
    catch: (err) =>
      new Error(
        err instanceof Error ? err.message : "Failed to fetch projects",
      ),
  });
}

/**
 * Hook to fetch list of projects
 * Uses TanStack Query with Effect pattern
 */
export function useListProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      return Effect.runPromise(
        listProjectsEffect().pipe(
          Effect.catchAll((err) => {
            // Re-throw error so TanStack Query can handle it
            return Effect.fail(err);
          }),
        ),
      );
    },
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

