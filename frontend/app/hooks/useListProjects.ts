import { useQuery } from "@tanstack/react-query";
import { Effect } from "effect";
import { apiClient } from "~/lib/api/authClient";
import { projectControllerListProjects } from "~/api";
import type { ProjectControllerListProjectsResponse } from "~/api/types.gen";

interface UseListProjectsOptions {
  pageSize?: number;
  index?: number;
}

/**
 * Effect-based API call for listing projects
 */
function listProjectsEffect(
  pageSize: number = 15,
  index: number = 0,
): Effect.Effect<ProjectControllerListProjectsResponse, Error> {
  return Effect.tryPromise({
    try: async () => {
      const { data } = await projectControllerListProjects({
        client: apiClient,
        query: {
          pageSize,
          index,
        },
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
export function useListProjects(options: UseListProjectsOptions = {}) {
  const { pageSize = 15, index = 0 } = options;

  return useQuery({
    queryKey: ["projects", pageSize, index],
    queryFn: async () => {
      return Effect.runPromise(
        listProjectsEffect(pageSize, index).pipe(
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
