import { useState } from "react";
import { toast } from "sonner";
import { EmailSentView } from "~/components/auth/EmailSentView";
import { LoginCard } from "~/components/auth/LoginCard";
import { LoginFooter } from "~/components/auth/LoginFooter";
import { LoginHeader } from "~/components/auth/LoginHeader";

export default function LoginPage() {
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);

  const handleGoogleLogin = () => {
    toast.info("Google login coming soon");
  };

  const handleMagicLinkSent = (email: string) => {
    setEmailSentTo(email);
  };

  const handleBackToLogin = () => {
    setEmailSentTo(null);
  };

  const handleResend = async () => {
    toast.success("Magic link resent");
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

