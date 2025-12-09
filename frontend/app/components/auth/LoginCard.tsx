import { useState } from "react";
import { Mail } from "lucide-react";
import { Link } from "react-router";

interface LoginCardProps {
  onGoogleLogin: () => Promise<void> | void;
  onMagicLinkSent: (email: string) => Promise<void> | void;
}

export function LoginCard({ onGoogleLogin, onMagicLinkSent }: LoginCardProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      await onMagicLinkSent(email);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl ring-1 ring-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />

        <div className="flex justify-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center ring-1 ring-primary/20 shadow-[0_0_20px_-5px_rgba(124,58,237,0.3)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8 text-primary"
            >
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M3 10h18" />
              <path d="M12 10v10" />
              <path d="M7 7h.01" />
              <path d="M11 7h.01" />
              <path d="M6 14h3" />
              <path d="M6 17h2" />
              <path d="M15 14h2" />
              <path d="M15 17h3" />
            </svg>
          </div>
        </div>

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-2xl font-bold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
            Welcome to LocalizeKit
          </h1>
          <p className="text-muted-foreground text-sm">
            Sign in to start converting your CSV files
          </p>
        </div>

        <button
          onClick={onGoogleLogin}
          className="relative z-10 w-full h-11 px-4 py-2 bg-white text-black border border-gray-200 rounded-lg hover:bg-gray-50 transition-all active:scale-[0.98] flex items-center justify-center gap-3 mb-6 font-medium text-sm"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z"
              fill="#4285F4"
            />
            <path
              d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z"
              fill="#34A853"
            />
            <path
              d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54772 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative z-10 flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-border/50"></div>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            or
          </span>
          <div className="flex-1 h-px bg-border/50"></div>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5 ml-1">
              Email address
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full h-11 pl-10 pr-4 bg-background/50 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full h-11 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all hover:shadow-[0_0_20px_-5px_rgba(124,58,237,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none font-medium"
          >
            {isLoading ? "Sending magic link..." : "Send magic link"}
          </button>
        </form>

        <p className="relative z-10 text-[10px] text-muted-foreground text-center mt-8 px-4 leading-relaxed">
          By clicking continue, you agree to our{" "}
          <Link to="/terms" className="hover:text-foreground underline underline-offset-2">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="hover:text-foreground underline underline-offset-2">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}

