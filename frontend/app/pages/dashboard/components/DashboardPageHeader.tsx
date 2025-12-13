import { Plus, Globe } from "lucide-react";
import { Button } from "~/components/ui/button";
import { openCreateProjectDialog } from "./CreateProjectDialog/CreateProjectDialog";

/**
 * Dashboard page header component
 */
export function DashboardPageHeader() {
  const handleCreateProject = async () => {
    const result = await openCreateProjectDialog();
    if (result) {
      // Project created successfully
      // TODO: Refresh projects list or navigate to new project
      console.log("Project created:", result);
    }
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
        <Button
          onClick={handleCreateProject}
          className="shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Create Project</span>
        </Button>
      </div>
    </div>
  );
}
