import { Link } from "react-router";
import { Sun, Moon, Globe } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useTheme } from "~/hooks/useTheme";
import { GithubIcon } from "~/components/icons/GithubIcon";
import { TypoP } from "~/components/typo";

export function Header() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 w-full items-center justify-between px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
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
            className="w-6 h-6 text-primary"
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
          <TypoP className="font-semibold">LocalizeKit</TypoP>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="border-0 bg-transparent hover:bg-secondary"
          >
            {isDark ? (
              <Sun className="size-5 text-muted-foreground" />
            ) : (
              <Moon className="size-5 text-muted-foreground" />
            )}
          </Button>

          {/* GitHub Link */}
          <a
            href="https://github.com/jinseokcentral-maker/Localize-Kit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="View on GitHub"
          >
            <GithubIcon className="size-5" />
          </a>

          {/* Docs Link */}
          <Link
            to="/docs"
            className="text-base text-muted-foreground hover:text-foreground transition-colors"
          >
            Docs
          </Link>

          {/* Login Button */}
          <Button size="md" asChild>
            <Link to="/login">Login</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
