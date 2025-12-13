/**
 * Dashboard page constants
 */

export const VIEW_MODES = ["grid", "list"] as const;
export const FILTER_STATUSES = ["all", "active", "archived", "paused"] as const;
export const SORT_OPTIONS = [
  "newest",
  "oldest",
  "name-asc",
  "name-desc",
  "updated",
] as const;

export const PAGE_SIZE = 15;

