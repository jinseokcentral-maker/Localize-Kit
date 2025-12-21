import { useQuery } from "@tanstack/react-query";
import { Effect } from "effect";
import { apiClient } from "~/lib/api/authClient";
import { getUsersMe } from "~/api";
import { extractApiData } from "~/lib/api/apiWrapper";
import { useTokenStore } from "~/stores/tokenStore";

export type TeamInfo = Readonly<{
    projectCount: number;
    plan?: string | unknown;
    canCreateProject: boolean;
    teamName: string;
    teamId?: string | unknown;
    memberCount: number;
    avatarUrl?: string | unknown;
    personal: boolean;
}>;

type UserData = {
    id: string;
    email?: string | unknown;
    fullName?: string | unknown;
    avatarUrl?: string | unknown;
    plan?: string | unknown;
    createdAt?: string | unknown;
    updatedAt?: string | unknown;
    teams?: TeamInfo[];
    activeTeamId?: string | unknown;
};

/**
 * Effect-based API call for getting current user profile
 */
function getMeEffect(): Effect.Effect<UserData, Error> {
    return Effect.tryPromise({
        try: async () => {
            const response = await getUsersMe({
                client: apiClient,
                throwOnError: true,
            });
            return extractApiData<UserData>(response.data);
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
 *
 * Only enabled when accessToken exists in tokenStore
 */
export function useGetMe() {
    const accessToken = useTokenStore((state) => state.accessToken);

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
        enabled: Boolean(accessToken), // Only fetch when accessToken exists
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}
