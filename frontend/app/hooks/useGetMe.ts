import { useQuery } from "@tanstack/react-query";
import { Effect } from "effect";
import { apiClient } from "~/api/authClient";
import { userControllerGetMe } from "~/api";
import type { UserControllerGetMeResponse } from "~/api/types.gen";

/**
 * Effect-based API call for getting current user profile
 */
function getMeEffect(): Effect.Effect<UserControllerGetMeResponse, Error> {
    return Effect.tryPromise({
        try: async () => {
            const { data } = await userControllerGetMe({
                client: apiClient,
                throwOnError: true,
            });
            return data;
        },
        catch: (err) =>
            new Error(
                err instanceof Error
                    ? err.message
                    : "Failed to fetch user profile",
            ),
    });
}

/**
 * Hook to fetch current user profile
 * Uses TanStack Query with Effect pattern
 */
export function useGetMe() {
    return useQuery({
        queryKey: ["user", "me"],
        queryFn: async () => {
            return Effect.runPromise(
                getMeEffect().pipe(
                    Effect.catchAll((err) => {
                        // Re-throw error so TanStack Query can handle it
                        return Effect.fail(err);
                    }),
                ),
            );
        },
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
