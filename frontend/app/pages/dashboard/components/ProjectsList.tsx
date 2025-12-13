import { useQueryState, parseAsStringLiteral, parseAsString } from "nuqs";
import { Effect } from "effect";
import { useListProjectsSuspense } from "~/hooks/query/useListProjectsSuspense";
import { ProjectCard } from "./ProjectCard";
import { EmptyState } from "./EmptyState";
import { ProjectPagination } from "./ProjectPagination";
import { filterAndSortProjects } from "../utils/projectFilters";
import { mapApiProjectsResponse } from "../utils/projectMapper";
import {
  VIEW_MODES,
  FILTER_STATUSES,
  SORT_OPTIONS,
  PAGE_SIZE,
} from "../constants";
import type { Project } from "~/types/dashboard";

interface ProjectsListProps {
  pageIndex: number;
  onClearSearch: () => void;
  onPageChange: (pageIndex: number) => void;
}

/**
 * Projects list component using Suspense
 */
export function ProjectsList({
  pageIndex,
  onClearSearch,
  onPageChange,
}: ProjectsListProps) {
  const [searchQuery] = useQueryState("search", parseAsString.withDefault(""));
  const [filterStatus] = useQueryState(
    "filter",
    parseAsStringLiteral(FILTER_STATUSES).withDefault("all")
  );
  const [sortOption] = useQueryState(
    "sort",
    parseAsStringLiteral(SORT_OPTIONS).withDefault("newest")
  );
  const [view] = useQueryState(
    "view",
    parseAsStringLiteral(VIEW_MODES).withDefault("list")
  );

  // Use suspense hook - this will suspend on loading/error
  // data is guaranteed to be defined here (loading handled by Suspense, errors by ErrorBoundary)
  const { data } = useListProjectsSuspense({
    pageSize: PAGE_SIZE,
    index: pageIndex,
  });

  // Map API response to Project[] using Effect
  const projects = Effect.runSync(
    mapApiProjectsResponse(data).pipe(
      Effect.catchAll(() => Effect.succeed([] as Project[]))
    )
  );

  const paginationMeta = data.meta;

  // Filter and sort projects (client-side filtering for now)
  const filteredProjects = filterAndSortProjects(projects, {
    searchQuery: searchQuery || "",
    filterStatus: filterStatus || "all",
    sortOption: sortOption || "newest",
  });

  if (filteredProjects.length === 0) {
    return (
      <EmptyState
        hasProjects={projects.length > 0}
        searchQuery={searchQuery}
        onClearSearch={onClearSearch}
      />
    );
  }

  return (
    <>
      <div
        className={
          (view || "list") === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
            : "space-y-4 mb-6"
        }
      >
        {filteredProjects.map((project) => (
          <ProjectCard
            key={project.id}
            view={(view || "list") as "grid" | "list"}
            project={project}
          />
        ))}
      </div>

      {paginationMeta && (
        <div className="mt-8 flex items-center justify-center border-t border-border pt-6">
          <ProjectPagination
            pageIndex={pageIndex}
            totalPageCount={paginationMeta.totalPageCount || 1}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </>
  );
}
