/**
 * Suspense-aware hook for listing projects
 * Uses TanStack Query's useSuspenseQuery with Effect pattern
 */
import { useSuspenseQuery } from "@tanstack/react-query";
import { Effect } from "effect";
import { apiClient } from "~/lib/api/authClient";
import { projectControllerListProjects } from "~/api";
import { extractApiData } from "~/lib/api/apiWrapper";
import type { ListProjectsResponseDto } from "~/api/types.gen";

interface UseListProjectsSuspenseOptions {
    pageSize?: number;
    index?: number;
}

/**
 * Effect-based API call for listing projects
 */
function listProjectsEffect(
    pageSize: number = 15,
    index: number = 0,
): Effect.Effect<ListProjectsResponseDto, Error> {
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
            return extractApiData<ListProjectsResponseDto>(data);
        },
        catch: (err) =>
            new Error(
                err instanceof Error ? err.message : "Failed to fetch projects",
            ),
    });
}

/**
 * Suspense-aware hook to fetch list of projects
 * Returns the data directly (suspends on loading, throws on error)
 */
export function useListProjectsSuspense(
    options: UseListProjectsSuspenseOptions = {},
) {
    const { pageSize = 15, index = 0 } = options;

    const query = useSuspenseQuery({
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
        // Note: useSuspenseQuery automatically keeps previous data during refetch
        // when data already exists in cache, so no placeholderData needed
    });

    return query;
}
