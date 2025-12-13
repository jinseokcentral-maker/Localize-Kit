/**
 * Effect-based authentication operations
 */
import { Effect } from "effect";
import { supabase } from "~/lib/supabaseClient";

/**
 * Sign in with Google OAuth using Effect
 */
export function signInWithGoogleEffect(
    redirectTo: string,
): Effect.Effect<void, Error> {
    return Effect.tryPromise({
        try: () =>
            supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo },
            }),
        catch: (err) =>
            new Error(
                err instanceof Error
                    ? err.message
                    : "Failed to sign in with Google",
            ),
    }).pipe(Effect.map(() => undefined));
}

/**
 * Sign in with OTP (Magic Link) using Effect
 */
export function signInWithOtpEffect(
    email: string,
    redirectTo: string,
): Effect.Effect<void, Error> {
    return Effect.tryPromise({
        try: () =>
            supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: redirectTo,
                    shouldCreateUser: true,
                },
            }),
        catch: (err) =>
            new Error(
                err instanceof Error
                    ? err.message
                    : "Failed to send magic link",
            ),
    }).pipe(
        Effect.flatMap((result) => {
            if (result.error) {
                return Effect.fail(new Error(result.error.message));
            }
            return Effect.void;
        }),
    );
}
