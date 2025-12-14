import { useQuery } from "@tanstack/react-query";
import { Effect } from "effect";
import { apiClient } from "~/lib/api/authClient";
import { userControllerGetMe } from "~/api";
import { extractApiData } from "~/lib/api/apiWrapper";
import type { TeamInfo } from "./query/useGetMe";

export type UserData = {
    id: string;
    email?: string | unknown;
    fullName?: string | unknown;
    avatarUrl?: string | unknown;
    plan?: string | unknown;
    createdAt?: string | unknown;
    updatedAt?: string | unknown;
    teams?: TeamInfo[];
    activeTeamId?: string;
};

/**
 * Effect-based API call for getting current user profile
 */
function getMeEffect(): Effect.Effect<UserData, Error> {
    return Effect.tryPromise({
        try: async () => {
            const { data } = await userControllerGetMe({
                client: apiClient,
                throwOnError: true,
            });
            return extractApiData<UserData>(data);
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
