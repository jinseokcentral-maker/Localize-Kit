import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useQueryClient } from "@tanstack/react-query";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";
import { ProjectFilters } from "./components/ProjectFilters";
import { ProjectsList } from "./components/ProjectsList";
import { ProjectsLoadingFallback } from "./components/ProjectsLoadingFallback";
import { ProjectsErrorFallback } from "./components/ProjectsErrorFallback";
import { DashboardStatsSection } from "./components/DashboardStatsSection";
import { DashboardPageHeader } from "./components/DashboardPageHeader";

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    parseAsString.withDefault("")
  );
  const [pageIndex, setPageIndex] = useQueryState(
    "page",
    parseAsInteger.withDefault(0)
  );

  // TODO: Replace with actual API call when stats API is available
  const isAtProjectLimit = false;

  return (
    <DashboardLayout currentPath="projects">
      <DashboardPageHeader />
      <DashboardStatsSection />
      {/* Filters & Search */}
      <ProjectFilters pageIndex={pageIndex} />
      {/* Projects List with Suspense and ErrorBoundary */}
      <ErrorBoundary
        FallbackComponent={ProjectsErrorFallback}
        resetKeys={[pageIndex]}
        onReset={() => {
          queryClient.resetQueries({ queryKey: ["projects"] });
        }}
      >
        <Suspense fallback={<ProjectsLoadingFallback />}>
          <ProjectsList
            pageIndex={pageIndex}
            onClearSearch={() => setSearchQuery(null)}
            onPageChange={setPageIndex}
          />
        </Suspense>
      </ErrorBoundary>
    </DashboardLayout>
  );
};
