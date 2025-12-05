import type { ReactNode } from "react";

interface MarketingLayoutProps {
  children: ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header will be added here */}
      <main>{children}</main>
      {/* Footer will be added here */}
    </div>
  );
}

