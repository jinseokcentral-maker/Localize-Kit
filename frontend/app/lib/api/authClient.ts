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

// Refresh queue and lock mechanism
interface QueuedRequest {
    request: Request;
    opts: RequestOptions;
    resolve: (response: Response) => void;
    reject: (error: Error) => void;
}

let refreshPromise: Promise<TokenBundle | null> | null = null;
const requestQueue: QueuedRequest[] = [];

async function refreshTokens(
    refreshPath: string,
    baseUrl: string,
    tokenProvider: TokenProvider,
    fetchFn: typeof fetch,
): Promise<TokenBundle | null> {
    // If refresh is already in progress, wait for it
    if (refreshPromise) {
        return refreshPromise;
    }

    const refreshToken = (await tokenProvider.getRefreshToken?.()) ?? undefined;
    if (!refreshToken) {
        await tokenProvider.clearTokens();
        return null;
    }

    // Start refresh
    refreshPromise = (async () => {
        try {
            const headers = new Headers({
                "Content-Type": "application/json",
            });
            const refreshReq = new Request(`${baseUrl}${refreshPath}`, {
                method: "POST",
                headers,
                body: JSON.stringify({ refreshToken }),
            });

            const refreshRes = await fetchFn(refreshReq);
            if (!refreshRes.ok) {
                await tokenProvider.clearTokens();
                return null;
            }

            let newTokens: TokenBundle;
            try {
                const json = await refreshRes.json();
                newTokens = json.data as TokenBundle;
            } catch {
                await tokenProvider.clearTokens();
                return null;
            }

            if (!newTokens.accessToken) {
                await tokenProvider.clearTokens();
                return null;
            }

            await tokenProvider.setTokens(newTokens);
            return newTokens;
        } catch (error) {
            await tokenProvider.clearTokens();
            return null;
        } finally {
            // Clear the promise so next refresh can happen
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

async function retryRequest(
    request: Request,
    opts: RequestOptions,
    accessToken: string,
    fetchFn: typeof fetch,
): Promise<Response> {
    const retryHeaders = new Headers(request.headers);
    retryHeaders.set("Authorization", `Bearer ${accessToken}`);
    const retryReq = new Request(request, { headers: retryHeaders });

    return fetchFn(retryReq, {
        ...opts.kyOptions,
        method: retryReq.method,
        headers: retryHeaders,
        body: request.body,
    } as any);
}

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

    // Handle 401 -> refresh -> retry with queue mechanism
    client.interceptors.response.use(
        async (response: Response, request: Request, opts: RequestOptions) => {
            if (response.status !== 401) return response;

            const isRefreshCall = request.url.includes(refreshPath) ||
                request.url.endsWith(refreshPath);

            if (isRefreshCall) {
                await tokenProvider.clearTokens();
                return response;
            }

            const fetchFn = opts.ky ?? fetch;

            // Queue this request
            return new Promise<Response>((resolve, reject) => {
                requestQueue.push({
                    request,
                    opts,
                    resolve,
                    reject,
                });

                // If this is the first request in queue, start refresh
                if (requestQueue.length === 1) {
                    refreshTokens(
                        refreshPath,
                        baseUrl ?? "",
                        tokenProvider,
                        fetchFn,
                    )
                        .then((newTokens) => {
                            if (!newTokens) {
                                // Refresh failed, reject all queued requests
                                const queue = [...requestQueue];
                                requestQueue.length = 0;
                                queue.forEach((queued) => {
                                    queued.reject(
                                        new Error("Token refresh failed"),
                                    );
                                });
                                return;
                            }

                            // Retry all queued requests with new token
                            const queue = [...requestQueue];
                            requestQueue.length = 0;

                            Promise.all(
                                queue.map((queued) =>
                                    retryRequest(
                                        queued.request,
                                        queued.opts,
                                        newTokens.accessToken,
                                        fetchFn,
                                    )
                                        .then(queued.resolve)
                                        .catch(queued.reject)
                                ),
                            ).catch((error) => {
                                // Handle any unexpected errors
                                queue.forEach((queued) => queued.reject(error));
                            });
                        })
                        .catch((error) => {
                            // Handle refresh errors
                            const queue = [...requestQueue];
                            requestQueue.length = 0;
                            queue.forEach((queued) => queued.reject(error));
                        });
                }
                // If queue already has items, refresh is already in progress,
                // just wait for it to complete (handled above)
            });
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
