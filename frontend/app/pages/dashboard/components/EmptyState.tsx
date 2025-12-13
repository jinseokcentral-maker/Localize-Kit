import { Plus, Globe, FileText } from "lucide-react";
import { Button } from "~/components/ui/button";
import { openCreateProjectDialog } from "./CreateProjectDialog/CreateProjectDialog";
import { useGetMe } from "~/hooks/useGetMe";
import {
  canCreateProject,
  getDisabledReason,
  type PlanName,
} from "../utils/planUtils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

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
  const { data: userData } = useGetMe();

  // Get plan from user data
  const plan = (
    typeof userData?.plan === "string" ? userData.plan : "free"
  ) as PlanName;

  // Check if user can create project
  const canCreate = canCreateProject(plan, userData?.team?.projectCount ?? 0);
  const disabledReason = getDisabledReason(
    plan,
    userData?.team?.projectCount ?? 0
  );

  const handleCreateProject = async () => {
    if (!canCreate) {
      return;
    }
    await openCreateProjectDialog();
  };
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
      {disabledReason ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">
              <Button onClick={handleCreateProject} disabled={!canCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent className="bg-card text-card-foreground border border-border shadow-md rounded-lg px-3 py-2 text-xs max-w-[280px]">
            <p className="leading-relaxed">{disabledReason}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Button onClick={handleCreateProject} disabled={!canCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Project
        </Button>
      )}
    </div>
  );
}
