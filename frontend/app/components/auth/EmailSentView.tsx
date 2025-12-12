import { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";

interface EmailSentViewProps {
  email: string;
  onBackToLogin: () => void;
  onResend: () => Promise<void> | void;
}

export function EmailSentView({
  email,
  onBackToLogin,
  onResend,
}: EmailSentViewProps) {
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    await onResend();
    setTimeout(() => setIsResending(false), 1000);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="mb-3 text-xl font-semibold">Check your email</h1>
          <p className="text-muted-foreground mb-4">We've sent a magic link to</p>
          <p className="text-foreground break-all">{email}</p>
        </div>

        <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
          <p className="text-sm text-muted-foreground text-center">
            Click the link in the email to sign in to your account. The link will
            expire in 24 hours.
          </p>
        </div>

        <button
          onClick={handleResend}
          disabled={isResending}
          className="w-full h-11 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {isResending ? "Sending..." : "Resend email"}
        </button>

        <button
          onClick={onBackToLogin}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </button>
      </div>
    </div>
  );
}








