/**
 * Loading fallback component for projects list
 */
export function ProjectsLoadingFallback() {
  return (
    <div className="bg-card border border-border rounded-xl p-12 text-center">
      <p className="text-muted-foreground">Loading projects...</p>
    </div>
  );
}
