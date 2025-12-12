import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmailSentView } from "~/components/auth/EmailSentView";
import { LoginCard } from "~/components/auth/LoginCard";
import { LoginFooter } from "~/components/auth/LoginFooter";
import { LoginHeader } from "~/components/auth/LoginHeader";
import { supabase, isSupabaseConfigured } from "~/lib/supabaseClient";

export default function LoginPage() {
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);

  const redirectTo = `${window.location.origin}${"/verify"}`;
  console.log(redirectTo, "redirectTo");
  console.log(window.location.origin, "window.location.origin");
  const handleGoogleLogin = () => {
    if (!isSupabaseConfigured) {
      toast.error(
        "Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
      );
    }
    supabase.auth
      .signInWithOAuth({
        provider: "google",
        // options: { redirectTo },
      })
      .catch((error) => {
        toast.error(error.message);
      });
  };

  const handleMagicLinkSent = async (email: string) => {
    if (!isSupabaseConfigured) {
      toast.error(
        "Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
      );
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });
    if (error) {
      toast.error(error.message);
      throw error;
    }
    setEmailSentTo(email);
    toast.success("Magic link sent. Check your inbox.");
  };

  const handleBackToLogin = () => {
    setEmailSentTo(null);
  };

  const handleResend = async () => {
    if (!emailSentTo) return;
    await handleMagicLinkSent(emailSentTo);
  };

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
