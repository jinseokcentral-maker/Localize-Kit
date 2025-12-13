interface ProjectFiltersErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Error fallback component for project filters
 * Filters are less critical, so we can show a simpler fallback or just the skeleton
 */
export function ProjectFiltersErrorFallback({
  error,
  resetErrorBoundary,
}: ProjectFiltersErrorFallbackProps) {
  // For filters, show a simple fallback - the filters will work without the count
  // Users can still use filters even if the count fails to load
  return (
    <div className="bg-card dark:bg-slate-900 border border-border rounded-xl p-2 mb-6 shadow-sm">
      <p className="text-xs text-muted-foreground text-center py-2">
        Filters temporarily unavailable
      </p>
    </div>
  );
}
