import { createClient, createConfig } from "~/api/client";
import type { Client, RequestOptions } from "~/api/client";
import { useTokenStore } from "~/stores/tokenStore";

type TokenBundle = {
    accessToken: string;
    refreshToken?: string;
};

type TokenProvider = {
    getAccessToken: () => Promise<string | null> | string | null;
    getRefreshToken: () => Promise<string | null> | string | null;
    setTokens: (tokens: TokenBundle) => Promise<void> | void;
    clearTokens: () => Promise<void> | void;
};

type AuthClientOptions = {
    baseUrl?: string;
    refreshPath?: string;
    tokenProvider: TokenProvider;
};

const isAuthHeaderMissing = (req: Request) =>
    !req.headers.has("authorization") && !req.headers.has("Authorization");

export const createAuthClient = ({
    baseUrl,
    refreshPath = "/auth/refresh",
    tokenProvider,
}: AuthClientOptions): Client => {
    const client = createClient(
        createConfig({
            baseUrl,
        }),
    );

    // Attach Authorization header if absent
    client.interceptors.request.use(async (request: Request) => {
        if (isAuthHeaderMissing(request)) {
            const accessToken = (await tokenProvider.getAccessToken?.()) ??
                undefined;
            if (accessToken) {
                const headers = new Headers(request.headers);
                headers.set("Authorization", `Bearer ${accessToken}`);
                request = new Request(request, { headers });
            }
        }
        return request;
    });

    // Handle 401 -> refresh -> retry
    client.interceptors.response.use(
        async (response: Response, request: Request, opts: RequestOptions) => {
            if (response.status !== 401) return response;

            const isRefreshCall = request.url.includes(refreshPath) ||
                request.url.endsWith(refreshPath);

            const refreshToken = (await tokenProvider.getRefreshToken?.()) ??
                undefined;
            if (!refreshToken || isRefreshCall) {
                await tokenProvider.clearTokens();
                return response;
            }

            // attempt refresh
            const headers = new Headers({
                "Content-Type": "application/json",
            });
            const refreshReq = new Request(
                `${opts.baseUrl ?? ""}${refreshPath}`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ refreshToken }),
                },
            );

            const refreshRes = await (opts.ky ?? fetch)(refreshReq);
            if (!refreshRes.ok) {
                await tokenProvider.clearTokens();
                return response;
            }

            let newTokens: TokenBundle;
            try {
                newTokens = (await refreshRes.json()) as TokenBundle;
            } catch {
                await tokenProvider.clearTokens();
                return response;
            }

            if (!newTokens.accessToken) {
                await tokenProvider.clearTokens();
                return response;
            }

            await tokenProvider.setTokens(newTokens);

            // retry original request with new access token
            const retryHeaders = new Headers(request.headers);
            retryHeaders.set(
                "Authorization",
                `Bearer ${newTokens.accessToken}`,
            );
            const retryReq = new Request(request, { headers: retryHeaders });

            return (opts.ky ?? fetch)(retryReq, {
                // reuse kyOptions if available; opts carries kyOptions on request
                ...opts.kyOptions,
                method: retryReq.method,
                headers: retryHeaders,
                body: request.body,
            } as any);
        },
    );

    return client;
};

const tokenStoreProvider: TokenProvider = {
    getAccessToken: () => useTokenStore.getState().accessToken,
    getRefreshToken: () => useTokenStore.getState().refreshToken,
    setTokens: ({ accessToken, refreshToken }) => {
        useTokenStore.getState().setAccessToken(accessToken ?? null);
        useTokenStore.getState().setRefreshToken(refreshToken ?? null);
    },
    clearTokens: () => {
        useTokenStore.getState().clear();
    },
};

const apiBaseUrl = typeof window !== "undefined"
    ? (import.meta.env.VITE_API_URL as string) ?? "http://localhost:8000"
    : (import.meta.env.VITE_API_URL as string) ?? "http://localhost:8000";

export const apiClient = createAuthClient({
    baseUrl: apiBaseUrl,
    refreshPath: "/auth/refresh",
    tokenProvider: tokenStoreProvider,
});
