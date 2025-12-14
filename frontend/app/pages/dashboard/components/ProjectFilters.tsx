import { Search, ArrowUpDown, LayoutGrid, List } from "lucide-react";
import { useQueryState, parseAsStringLiteral, parseAsString } from "nuqs";
import type { ViewMode, FilterStatus, SortOption } from "~/types/dashboard";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useListProjectsSuspense } from "~/hooks/query/useListProjectsSuspense";
import {
  VIEW_MODES,
  FILTER_STATUSES,
  SORT_OPTIONS,
  PAGE_SIZE,
} from "../constants";
import { ProjectFiltersSkeleton } from "./ProjectFiltersSkeleton";
import { ProjectFiltersErrorFallback } from "./ProjectFiltersErrorFallback";
import { useDebounce } from "~/hooks/useDebounce";

function ProjectFiltersContent({ pageIndex }: { pageIndex: number }) {
  const [view, setView] = useQueryState(
    "view",
    parseAsStringLiteral(VIEW_MODES).withDefault("list")
  );
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    parseAsString.withDefault("")
  );
  const [filterStatus, setFilterStatus] = useQueryState(
    "filter",
    parseAsStringLiteral(FILTER_STATUSES).withDefault("all")
  );
  const [sortOption, setSortOption] = useQueryState(
    "sort",
    parseAsStringLiteral(SORT_OPTIONS).withDefault("newest")
  );

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery || "", 500);

  // Convert filterStatus to API status parameter
  const apiStatus: "active" | "archived" | undefined =
    filterStatus === "active"
      ? "active"
      : filterStatus === "archived"
      ? "archived"
      : undefined;

  // Convert sortOption to API sort parameter
  const apiSort: "newest" | "oldest" | undefined =
    sortOption === "newest"
      ? "newest"
      : sortOption === "oldest"
      ? "oldest"
      : undefined;

  // Get projects count for display
  const { data } = useListProjectsSuspense({
    pageSize: PAGE_SIZE,
    index: pageIndex,
    status: apiStatus,
    search: debouncedSearchQuery || undefined,
    sort: apiSort,
  });

  // Use totalCount from API meta for accurate count
  const projectsCount = data?.meta?.totalCount ?? 0;
  return (
    <div className="bg-card dark:bg-slate-900 border border-border rounded-xl p-2 mb-6 shadow-sm flex flex-col md:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, language, or framework..."
          value={searchQuery || ""}
          onChange={(e) => setSearchQuery(e.target.value || null)}
          className="w-full h-10 bg-transparent border-none pl-10 pr-4 text-sm focus:outline-none focus:ring-0 placeholder:text-muted-foreground/60"
        />
      </div>
      <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-border pt-2 md:pt-0 pl-0 md:pl-2 overflow-x-auto">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-2 text-sm font-medium rounded-lg flex items-center gap-2 whitespace-nowrap transition-colors ${
            filterStatus === "all"
              ? "text-foreground bg-muted/50"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          All Projects
          <span className="bg-background text-xs px-1.5 py-0.5 rounded-md border border-border text-muted-foreground">
            {projectsCount}
          </span>
        </button>
        <button
          onClick={() => setFilterStatus("active")}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            filterStatus === "active"
              ? "text-foreground bg-muted/50"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilterStatus("archived")}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            filterStatus === "archived"
              ? "text-foreground bg-muted/50"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          Archived
        </button>

        <div className="h-4 w-px bg-border mx-1 hidden md:block"></div>

        <button
          onClick={() =>
            setSortOption(sortOption === "newest" ? "oldest" : "newest")
          }
          className="px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap text-foreground bg-muted/50 hover:bg-muted/70"
        >
          <ArrowUpDown className="w-4 h-4" />
          {sortOption === "newest" ? "Newest first" : "Oldest first"}
        </button>

        <div className="flex bg-muted/30 p-1 rounded-lg border border-border/50">
          <button
            onClick={() => setView("list")}
            className={`p-1.5 rounded-md transition-all ${
              view === "list"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("grid")}
            className={`p-1.5 rounded-md transition-all ${
              view === "grid"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ProjectFiltersProps {
  pageIndex: number;
}

export function ProjectFilters({ pageIndex }: ProjectFiltersProps) {
  return (
    <ErrorBoundary FallbackComponent={ProjectFiltersErrorFallback}>
      <Suspense fallback={<ProjectFiltersSkeleton />}>
        <ProjectFiltersContent pageIndex={pageIndex} />
      </Suspense>
    </ErrorBoundary>
  );
}
