import { Link } from "react-router";
import { Globe } from "lucide-react";

export function LoginHeader() {
  return (
    <header className="px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Globe className="w-6 h-6 text-primary" />
          <span className="font-semibold">LocalizeKit</span>
        </Link>
      </div>
    </header>
  );
}







