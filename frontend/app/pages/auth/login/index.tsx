import { useState } from "react";
import { Effect } from "effect";
import { toast } from "sonner";
import { EmailSentView } from "~/components/auth/EmailSentView";
import { LoginCard } from "~/components/auth/LoginCard";
import { LoginFooter } from "~/components/auth/LoginFooter";
import { LoginHeader } from "~/components/auth/LoginHeader";
import { isSupabaseConfigured } from "~/lib/supabaseClient";
import {
  signInWithGoogleEffect,
  signInWithOtpEffect,
} from "./utils/authEffects";

export default function LoginPage() {
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);

  const redirectTo = `${window.location.origin}${"/verify"}`;

  function handleGoogleLogin() {
    if (!isSupabaseConfigured) {
      toast.error(
        "Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
      );
      return;
    }

    Effect.runPromise(
      signInWithGoogleEffect(redirectTo).pipe(
        Effect.catchAll((err) => {
          toast.error(err.message);
          return Effect.void;
        })
      )
    );
  }

  function handleMagicLinkSent(email: string) {
    if (!isSupabaseConfigured) {
      toast.error(
        "Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
      );
      return;
    }

    Effect.runPromise(
      signInWithOtpEffect(email, redirectTo).pipe(
        Effect.catchAll((err) => {
          toast.error(err.message);
          return Effect.fail(err);
        })
      )
    )
      .then(() => {
        setEmailSentTo(email);
        toast.success("Magic link sent. Check your inbox.");
      })
      .catch(() => {
        // Error already handled in catchAll
      });
  }

  function handleBackToLogin() {
    setEmailSentTo(null);
  }

  function handleResend() {
    if (!emailSentTo) return;
    handleMagicLinkSent(emailSentTo);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <LoginHeader />
      <main className="flex-1 flex items-center justify-center pb-12">
        {emailSentTo ? (
          <EmailSentView
            email={emailSentTo}
            onBackToLogin={handleBackToLogin}
            onResend={handleResend}
          />
        ) : (
          <LoginCard
            onGoogleLogin={handleGoogleLogin}
            onMagicLinkSent={handleMagicLinkSent}
          />
        )}
      </main>
      <LoginFooter />
    </div>
  );
}
