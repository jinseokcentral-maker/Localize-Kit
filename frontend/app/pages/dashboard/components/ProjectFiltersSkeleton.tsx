import { Search, ArrowUpDown, LayoutGrid, List } from "lucide-react";

/**
 * Skeleton fallback for ProjectFilters component
 */
export function ProjectFiltersSkeleton() {
  return (
    <div className="bg-card dark:bg-slate-900 border border-border rounded-xl p-2 mb-6 shadow-sm flex flex-col md:flex-row gap-2">
      {/* Search input skeleton */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
        <div className="w-full h-10 bg-muted/50 rounded-md animate-pulse" />
      </div>

      {/* Filters and buttons skeleton */}
      <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-border pt-2 md:pt-0 pl-0 md:pl-2 overflow-x-auto">
        {/* All Projects button skeleton */}
        <div className="px-3 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap bg-muted/50 animate-pulse">
          <div className="h-4 w-20 bg-background/50 rounded" />
          <div className="h-4 w-6 bg-background/50 rounded" />
        </div>

        {/* Active button skeleton */}
        <div className="px-3 py-2 rounded-lg whitespace-nowrap bg-muted/50 animate-pulse">
          <div className="h-4 w-12 bg-background/50 rounded" />
        </div>

        {/* Archived button skeleton */}
        <div className="px-3 py-2 rounded-lg whitespace-nowrap bg-muted/50 animate-pulse">
          <div className="h-4 w-16 bg-background/50 rounded" />
        </div>

        <div className="h-4 w-px bg-border mx-1 hidden md:block" />

        {/* Sort button skeleton */}
        <div className="px-3 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap bg-muted/50 animate-pulse">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground/50" />
          <div className="h-4 w-20 bg-background/50 rounded" />
        </div>

        {/* View toggle skeleton */}
        <div className="flex bg-muted/30 p-1 rounded-lg border border-border/50">
          <div className="p-1.5 rounded-md bg-background/50 animate-pulse">
            <List className="w-4 h-4 text-muted-foreground/50" />
          </div>
          <div className="p-1.5 rounded-md bg-background/50 animate-pulse">
            <LayoutGrid className="w-4 h-4 text-muted-foreground/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
