import { Globe, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import type { ViewMode, Project } from "~/types/dashboard";
import { formatRelativeDate } from "../utils/dateUtils";
import { filterProjectLanguages } from "../utils/projectUtils";
import { Badge } from "~/components/ui/badge";

interface ProjectCardProps {
  view: ViewMode;
  project: Project;
}

export function ProjectCard({ view, project }: ProjectCardProps) {
  const isGrid = view === "grid";

  // Get languages array (handle both string array and unknown types)
  const languages = filterProjectLanguages(project.languages);

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
          {/* Project Icon */}
          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-base font-bold text-blue-600 dark:text-blue-400 shadow-inner shrink-0">
            <Globe className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header: Name */}
            <div className="flex items-center gap-2.5 mb-1">
              <h3 className="text-base font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                {project.name}
              </h3>
              <Badge
                variant={project.status === "archived" ? "secondary" : "default"}
                className="text-xs"
              >
                {project.status === "archived" ? "Archived" : "Active"}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
              {typeof project.description === "string"
                ? project.description
                : ""}
            </p>

            {/* Metadata Chips */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {languages.length > 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-muted/50 dark:bg-slate-800/50 rounded-md border border-border/50">
                  <Globe className="w-3 h-3 text-slate-500" />
                  <span className="font-medium text-foreground">
                    {typeof project.defaultLanguage === "string"
                      ? project.defaultLanguage
                      : languages[0]}
                  </span>
                  {languages.length > 1 && (
                    <>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium text-foreground">
                        {languages.length} langs
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          className={`flex ${
            isGrid
              ? "flex-col mt-4"
              : "items-center justify-between md:flex-col md:items-end"
          } gap-3 min-w-[140px]`}
        >
          <div className={`w-full ${isGrid ? "" : "text-right"}`}>
            <div
              className={`flex items-center gap-1 text-[11px] text-muted-foreground ${
                isGrid ? "" : "justify-end"
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>
                Updated{" "}
                {typeof project.updatedAt === "string"
                  ? formatRelativeDate(project.updatedAt)
                  : "recently"}
              </span>
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
}
