// Dashboard Types

export type ProjectStatus = "active" | "warning" | "paused" | "archived";

export type ProjectFramework =
  | "Next.js"
  | "React"
  | "React Native"
  | "Vue"
  | "Angular"
  | "Svelte"
  | "Other";

export type ViewMode = "grid" | "list";

export type SortOption =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "updated";

export type FilterStatus = "all" | "active" | "archived" | "paused";

export interface Project {
  id: string;
  name: string;
  description: string;
  type: ProjectFramework;
  sourceLang: string;
  targetLangs: string[];
  totalKeys: number;
  progress: number; // 0-100
  updatedAt: string; // ISO date string or relative time
  status: ProjectStatus;
  apiUsage?: number; // API requests count
  apiLimit?: number; // API limit for plan
  slug: string;
  defaultLanguage: string;
  languages: string[];
  createdAt: string;
}

export interface DashboardStats {
  totalTranslations: number;
  apiUsage: number;
  apiLimit: number;
  activeLanguages: number;
  totalProjects: number;
  projectsLimit: number;
}

export interface UserPlan {
  plan: "free" | "pro" | "team";
  projectsUsed: number;
  projectsLimit: number;
  apiUsage: number;
  apiLimit: number;
}
