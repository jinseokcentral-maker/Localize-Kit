import { useState } from "react";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";
import { filterAndSortProjects } from "./utils/projectFilters";
import {
  Plus,
  Search,
  Globe,
  Clock,
  Code2,
  ArrowUpDown,
  Zap,
  Languages,
  ArrowRight,
  LayoutGrid,
  List,
  AlertCircle,
  FileText,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router";
import type {
  Project,
  ProjectStatus,
  ViewMode,
  SortOption,
  FilterStatus,
  DashboardStats,
} from "~/types/dashboard";
import { Button } from "~/components/ui/button";
import { useGetMe } from "~/hooks/useGetMe";
import { useListProjects } from "~/hooks/useListProjects";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";

// Mock data - will be replaced with actual API calls
const mockProjects: Project[] = [
  {
    id: "1",
    name: "Marketing Landing Page",
    description: "Main website localization project",
    type: "Next.js",
    sourceLang: "EN",
    targetLangs: ["KR", "JP", "CN"],
    totalKeys: 1240,
    progress: 98,
    updatedAt: "2 hours ago",
    status: "active",
    apiUsage: 12500,
    apiLimit: 50000,
    slug: "marketing-landing",
    defaultLanguage: "EN",
    languages: ["EN", "KR", "JP", "CN"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Admin Dashboard",
    description: "Internal administration tools",
    type: "React",
    sourceLang: "EN",
    targetLangs: ["KR", "DE"],
    totalKeys: 856,
    progress: 45,
    updatedAt: "1 day ago",
    status: "active",
    apiUsage: 2100,
    apiLimit: 50000,
    slug: "admin-dashboard",
    defaultLanguage: "EN",
    languages: ["EN", "KR", "DE"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Mobile App (iOS/Android)",
    description: "React Native mobile application",
    type: "React Native",
    sourceLang: "EN",
    targetLangs: ["KR", "ES", "FR", "IT"],
    totalKeys: 3420,
    progress: 82,
    updatedAt: "3 days ago",
    status: "warning",
    apiUsage: 30500,
    apiLimit: 50000,
    slug: "mobile-app",
    defaultLanguage: "EN",
    languages: ["EN", "KR", "ES", "FR", "IT"],
    createdAt: new Date().toISOString(),
  },
];

const mockStats: DashboardStats = {
  totalTranslations: 12450,
  apiUsage: 45200,
  apiLimit: 50000,
  activeLanguages: 8,
  totalProjects: 3,
  projectsLimit: 3,
};

export const DashboardPage: React.FC = () => {
  const [view, setView] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 15;

  // Fetch projects from API
  const { data: projectsData, isLoading } = useListProjects({
    pageSize,
    index: pageIndex,
  });

  // Use mock data for now (API response structure differs from Project type)
  // TODO: Map API response to Project type when backend is ready
  const projects = mockProjects;
  const paginationMeta = projectsData?.data?.meta ?? {
    index: pageIndex,
    pageSize,
    hasNext: false,
  };
  const [stats] = useState<DashboardStats>(mockStats);

  // Filter and sort projects (client-side filtering for now)
  const filteredProjects = filterAndSortProjects(projects, {
    searchQuery,
    filterStatus,
    sortOption,
  });

  const isAtProjectLimit = stats.totalProjects >= stats.projectsLimit;
  const apiUsagePercent = (stats.apiUsage / stats.apiLimit) * 100;
  const isApiUsageWarning = apiUsagePercent >= 80;

  return (
    <DashboardLayout currentPath="projects">
      {/* Page Header */}
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
          {isAtProjectLimit ? (
            <div className="hidden md:flex items-center px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium border border-amber-200 dark:border-amber-500/20">
              <AlertCircle className="w-3 h-3 mr-2" />
              {stats.totalProjects}/{stats.projectsLimit} Projects (Free Plan)
            </div>
          ) : (
            <div className="hidden md:flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
              {stats.totalProjects}/{stats.projectsLimit} Projects (Free Plan)
            </div>
          )}
          <Button
            asChild
            disabled={isAtProjectLimit}
            className="shadow-sm hover:shadow-md"
          >
            <Link to="/dashboard/projects/new">
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Upgrade Banner (if at limit) */}
      {isAtProjectLimit && (
        <div className="mb-6 p-4 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                Upgrade to Pro
              </p>
              <p className="text-xs text-muted-foreground">
                Create unlimited projects and unlock advanced features
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="default">
            <Link to="/pricing">Upgrade Now</Link>
          </Button>
        </div>
      )}

      {/* Stats Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatsCard
          title="Total Translations"
          value="12,450"
          label="keys"
          icon={Languages}
          trend="+12% this month"
          trendUp={true}
        />
        <StatsCard
          title="API Usage"
          value={`${(stats.apiUsage / 1000).toFixed(1)}k`}
          label={`/ ${(stats.apiLimit / 1000).toFixed(0)}k`}
          icon={Zap}
          trend={`${apiUsagePercent.toFixed(0)}% usage`}
          trendUp={false}
          warning={isApiUsageWarning}
        />
        <StatsCard
          title="Active Languages"
          value={stats.activeLanguages.toString()}
          label="languages"
          icon={Globe}
          trend="+2 new"
          trendUp={true}
        />
      </div>

      {/* Filters & Search */}
      <div className="bg-card dark:bg-slate-900 border border-border rounded-xl p-2 mb-6 shadow-sm flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, language, or framework..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
              {projects.length}
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
            onClick={() => setSortOption("newest")}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
              sortOption === "newest"
                ? "text-foreground bg-muted/50"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <ArrowUpDown className="w-4 h-4" />
            Newest first
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

      {/* Projects List or Empty State */}
      {isLoading ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          hasProjects={projects.length > 0}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery("")}
        />
      ) : (
        <>
          <div
            className={
              view === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
                : "space-y-4 mb-6"
            }
          >
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} view={view} project={project} />
            ))}
          </div>

          {/* Pagination */}
          {paginationMeta && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={(e) => {
                      e.preventDefault();
                      if (pageIndex > 0) {
                        setPageIndex(pageIndex - 1);
                      }
                    }}
                    className={
                      pageIndex === 0
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {/* Page numbers */}
                {(() => {
                  const currentPage = pageIndex + 1;
                  // Since we don't have total count, show pages around current
                  // Show at least current page and nearby pages
                  const pages: (number | "ellipsis")[] = [];

                  // Always show first page if not on first page
                  if (currentPage > 1) {
                    pages.push(1);
                    if (currentPage > 3) {
                      pages.push("ellipsis");
                    }
                  }

                  // Show pages around current
                  const start = Math.max(1, currentPage - 1);
                  const end = currentPage + 1;

                  for (let i = start; i <= end; i++) {
                    if (i === 1 && currentPage > 1) continue; // Already added
                    pages.push(i);
                  }

                  // Show ellipsis and next page indicator if hasNext
                  if (paginationMeta.hasNext) {
                    if (currentPage < end) {
                      pages.push("ellipsis");
                    }
                    // Don't show exact last page since we don't know it
                  }

                  return pages.map((page, idx) => (
                    <PaginationItem key={idx}>
                      {page === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={(e) => {
                            e.preventDefault();
                            setPageIndex(page - 1);
                          }}
                          isActive={page === currentPage}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ));
                })()}

                <PaginationItem>
                  <PaginationNext
                    onClick={(e) => {
                      e.preventDefault();
                      if (paginationMeta.hasNext) {
                        setPageIndex(pageIndex + 1);
                      }
                    }}
                    className={
                      !paginationMeta.hasNext
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

// Stats Card Component
const StatsCard = ({
  title,
  value,
  label,
  icon: Icon,
  trend,
  trendUp,
  warning,
}: {
  title: string;
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: string;
  trendUp: boolean;
  warning?: boolean;
}) => (
  <div className="bg-card dark:bg-slate-900 border border-border p-5 rounded-xl shadow-sm flex items-start justify-between group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
    <div>
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">
        {title}
      </p>
      <div className="flex items-baseline gap-1.5">
        <h3 className="text-2xl font-bold text-foreground">{value}</h3>
        <span className="text-sm text-muted-foreground font-medium">
          {label}
        </span>
      </div>
      <div
        className={`flex items-center gap-1 mt-2 text-xs font-medium ${
          warning
            ? "text-amber-500"
            : trendUp
            ? "text-emerald-500"
            : "text-muted-foreground"
        }`}
      >
        {warning ? (
          <AlertCircle className="w-3 h-3" />
        ) : (
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              trendUp ? "bg-emerald-500" : "bg-slate-400"
            }`}
          ></div>
        )}
        {trend}
      </div>
    </div>
    <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
      <Icon className="w-5 h-5" />
    </div>
  </div>
);

// Project Card Component
const ProjectCard = ({
  view,
  project,
}: {
  view: ViewMode;
  project: Project;
}) => {
  const isGrid = view === "grid";

  const getStatusIndicator = (status: ProjectStatus) => {
    switch (status) {
      case "active":
        return (
          <span className="relative flex h-2 w-2" title="Active">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        );
      case "warning":
        return (
          <span className="relative flex h-2 w-2" title="Needs attention">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        );
      case "paused":
        return (
          <span className="relative flex h-2 w-2" title="Paused">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`bg-card dark:bg-slate-900 border border-border rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all group cursor-pointer relative overflow-hidden flex flex-col ${
        isGrid ? "h-full" : ""
      }`}
    >
      <div
        className={`p-5 ${
          isGrid
            ? "flex-1"
            : "flex flex-col md:flex-row md:items-center justify-between gap-5"
        }`}
      >
        <div className="flex items-start gap-3.5 flex-1">
          {/* Framework Icon */}
          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 border border-border flex items-center justify-center text-base font-bold text-slate-600 dark:text-slate-300 shadow-inner flex-shrink-0">
            {project.type === "Next.js"
              ? "N"
              : project.type === "React"
              ? "R"
              : "M"}
          </div>

          <div className="flex-1 min-w-0">
            {/* Header: Name & Status */}
            <div className="flex items-center gap-2.5 mb-1">
              <h3 className="text-base font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                {project.name}
              </h3>
              {getStatusIndicator(project.status)}
            </div>

            <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
              {project.description}
            </p>

            {/* Metadata Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-muted/50 dark:bg-slate-800/50 rounded-md border border-border/50">
                <Code2 className="w-3 h-3 text-slate-500" />
                <span className="font-medium text-foreground">
                  {project.type}
                </span>
              </div>
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-muted/50 dark:bg-slate-800/50 rounded-md border border-border/50">
                <Globe className="w-3 h-3 text-slate-500" />
                <span className="font-medium text-foreground">
                  {project.sourceLang}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium text-foreground">
                  {project.targetLangs.length}
                </span>
              </div>
              {project.apiUsage !== undefined && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-muted/50 dark:bg-slate-800/50 rounded-md border border-border/50">
                  <Zap className="w-3 h-3 text-slate-500" />
                  <span className="font-medium text-foreground">
                    {project.apiUsage >= 1000
                      ? `${(project.apiUsage / 1000).toFixed(1)}k`
                      : project.apiUsage}{" "}
                    reqs
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats & Actions */}
        <div
          className={`flex ${
            isGrid
              ? "flex-col mt-4"
              : "items-center justify-between md:flex-col md:items-end"
          } gap-3 min-w-[140px]`}
        >
          <div className={`w-full ${isGrid ? "" : "text-right"}`}>
            <div
              className={`flex items-center gap-2 mb-1 ${
                isGrid ? "" : "justify-end"
              }`}
            >
              <span className="text-[11px] font-medium text-muted-foreground">
                {project.progress}% Translated
              </span>
              <span className="text-[11px] font-bold text-foreground">
                {project.totalKeys} keys
              </span>
            </div>
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  project.progress === 100
                    ? "bg-emerald-500"
                    : project.progress > 50
                    ? "bg-blue-500"
                    : "bg-amber-500"
                }`}
                style={{ width: `${project.progress}%` }}
              ></div>
            </div>

            <div
              className={`flex items-center gap-1 text-[11px] text-muted-foreground mt-1.5 ${
                isGrid ? "" : "justify-end"
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Updated {project.updatedAt}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="border-t border-border bg-muted/20 px-5 py-2.5 flex items-center justify-between">
        <Link
          to={`/dashboard/projects/${project.id}/settings`}
          className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Quick Settings
        </Link>
        <Link
          to={`/dashboard/projects/${project.id}`}
          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          View Translations <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({
  hasProjects,
  searchQuery,
  onClearSearch,
}: {
  hasProjects: boolean;
  searchQuery: string;
  onClearSearch: () => void;
}) => {
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
      <Button asChild>
        <Link to="/dashboard/projects/new">
          <Plus className="w-4 h-4 mr-2" />
          Create Project
        </Link>
      </Button>
    </div>
  );
};
