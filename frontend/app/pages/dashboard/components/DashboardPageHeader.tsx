import { Plus, Globe } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";

/**
 * Dashboard page header component
 */
export function DashboardPageHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          Projects
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your localization projects and monitor translation progress.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button asChild className="shadow-sm hover:shadow-md">
          <Link to="/dashboard/projects/new">
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}

