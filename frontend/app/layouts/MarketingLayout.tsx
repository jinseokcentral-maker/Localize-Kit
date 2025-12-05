import type { ReactNode } from "react";
import { Header } from "~/components/landing/Header";

interface MarketingLayoutProps {
  children: ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>{children}</main>
      {/* Footer will be added here */}
    </div>
  );
}
