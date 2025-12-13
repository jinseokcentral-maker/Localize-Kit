import { Plus, Globe, FileText } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";

interface EmptyStateProps {
  hasProjects: boolean;
  searchQuery: string;
  onClearSearch: () => void;
}

export function EmptyState({
  hasProjects,
  searchQuery,
  onClearSearch,
}: EmptyStateProps) {
  if (searchQuery) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No projects found
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          No projects match your search for &quot;{searchQuery}&quot;
        </p>
        <Button variant="outline" onClick={onClearSearch}>
          Clear search
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-12 text-center">
      <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No projects yet
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        {hasProjects
          ? "Create your first project to get started with localization."
          : "Get started by creating your first localization project."}
      </p>
      <Button asChild>
        <Link to="/dashboard/projects/new">
          <Plus className="w-4 h-4 mr-2" />
          Create Project
        </Link>
      </Button>
    </div>
  );
}
