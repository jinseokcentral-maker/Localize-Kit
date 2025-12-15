import React from "react";
import { DashboardSidebar } from "./DashboardSidebarBoundary";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "../ui/sidebar";
import { Separator } from "../ui/separator";
import { Search, Bell, HelpCircle, Sun, Moon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "../ui/button";
import { useTheme } from "~/hooks/useTheme";

interface LayoutProps {
  children: React.ReactNode;
  currentPath?: string;
}

export const DashboardLayout: React.FC<LayoutProps> = ({
  children,
  currentPath = "dashboard",
}) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <SidebarProvider>
      <DashboardSidebar currentPath={currentPath} />
      <SidebarInset>
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex h-16 w-full items-center justify-between px-8">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-2" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="text-base font-semibold hidden md:block hover:text-primary transition-colors"
                >
                  LocalizeKit
                </Link>
                <span className="text-base text-muted-foreground hidden md:block">
                  /
                </span>
                <span className="text-base font-medium capitalize">
                  {currentPath}
                </span>
              </div>
            </div>

            <nav className="flex items-center gap-6">
              {/* Search - simplified */}
              <div className="relative hidden md:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="h-8 w-64 bg-muted/50 border border-transparent rounded-md pl-10 pr-4 text-sm focus:bg-background focus:border-border focus:ring-1 focus:ring-blue-500/20 transition-all outline-none placeholder:text-muted-foreground/70"
                />
              </div>
              <div className="h-4 w-px bg-border mx-2 hidden md:block"></div>
              <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors relative group">
                <Bell className="size-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background"></span>
              </button>
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={toggleTheme}
                aria-label={
                  isDark ? "Switch to light mode" : "Switch to dark mode"
                }
                className="border-0 bg-transparent hover:bg-secondary"
              >
                {isDark ? (
                  <Sun className="size-5 text-muted-foreground" />
                ) : (
                  <Moon className="size-5 text-muted-foreground" />
                )}
              </Button>
              <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
                <HelpCircle className="size-5" />
              </button>
            </nav>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 pt-6 bg-muted/10 min-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};
