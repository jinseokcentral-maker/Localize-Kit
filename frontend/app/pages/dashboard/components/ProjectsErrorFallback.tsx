import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "~/components/ui/button";

interface ProjectsErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Error fallback component for projects list
 */
export function ProjectsErrorFallback({
  error,
  resetErrorBoundary,
}: ProjectsErrorFallbackProps) {
  return (
    <div className="bg-card border border-destructive/50 rounded-xl p-12 text-center">
      <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Failed to load projects
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {error.message ||
          "An unexpected error occurred while loading projects."}
      </p>
      <Button onClick={resetErrorBoundary} variant="outline">
        <RefreshCw className="w-4 h-4 mr-2" />
        Try again
      </Button>
    </div>
  );
}
