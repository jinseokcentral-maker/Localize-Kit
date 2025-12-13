import { Plus, Globe } from "lucide-react";
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

/**
 * Dashboard page header component
 */
export function DashboardPageHeader() {
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
        {disabledReason ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <Button
                  onClick={handleCreateProject}
                  disabled={!canCreate}
                  className="shadow-sm hover:shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Project</span>
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent className="bg-card text-card-foreground border border-border shadow-md rounded-lg px-3 py-2 text-xs max-w-[280px]">
              <p className="leading-relaxed">{disabledReason}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            onClick={handleCreateProject}
            disabled={!canCreate}
            className="shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </Button>
        )}
      </div>
    </div>
  );
}
