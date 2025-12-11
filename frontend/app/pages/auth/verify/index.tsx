import React from "react";
import { Loader2 } from "lucide-react";

export const VerifyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-size-[32px]" />
      <div className="absolute inset-0 bg-linear-to-tr from-background via-background/90 to-background" />

      <div className="relative z-10 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
        {/* Loading Spinner */}
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 ring-1 ring-primary/20 shadow-[0_0_30px_-10px_rgba(124,58,237,0.3)]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>

        {/* Text Content */}
        <h1 className="text-2xl font-bold tracking-tight mb-3 bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/70">
          Verifying your account
        </h1>
        <p className="text-muted-foreground text-sm max-w-[300px] leading-relaxed">
          Please wait while we securely authenticate your credentials and set up
          your workspace.
        </p>

        {/* Progress Bar (Visual only) */}
        <div className="w-full max-w-[200px] h-1 bg-secondary rounded-full mt-8 overflow-hidden">
          <div className="h-full bg-primary origin-left scale-x-[1] animate-progress-bar" />
        </div>
      </div>
    </div>
  );
};
