import { Link } from "react-router";

export function LoginFooter() {
  return (
    <footer className="px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-sm text-muted-foreground">
          © 2024 LocalizeKit
          <span className="mx-2">·</span>
          <Link to="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <span className="mx-2">·</span>
          <Link to="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
        </p>
      </div>
    </footer>
  );
}







