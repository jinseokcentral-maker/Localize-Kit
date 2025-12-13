/**
 * Dashboard project filtering and sorting utilities
 */
import type { FilterStatus, Project, SortOption } from "~/types/dashboard";

/**
 * Filter projects by search query
 */
export function filterProjectsBySearch(
    projects: Project[],
    searchQuery: string,
): Project[] {
    if (!searchQuery) return projects;

    const query = searchQuery.toLowerCase();
    return projects.filter(
        (p) =>
            p.name.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            p.type.toLowerCase().includes(query) ||
            p.targetLangs.some((lang) => lang.toLowerCase().includes(query)),
    );
}

/**
 * Filter projects by status
 */
export function filterProjectsByStatus(
    projects: Project[],
    filterStatus: FilterStatus,
): Project[] {
    if (filterStatus === "all") return projects;
    return projects.filter((p) => p.status === filterStatus);
}

/**
 * Sort projects by sort option
 */
export function sortProjects(
    projects: Project[],
    sortOption: SortOption,
): Project[] {
    const sorted = [...projects].sort((a, b) => {
        switch (sortOption) {
            case "newest":
                return (
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                );
            case "oldest":
                return (
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime()
                );
            case "name-asc":
                return a.name.localeCompare(b.name);
            case "name-desc":
                return b.name.localeCompare(a.name);
            case "updated":
                // Simplified - would need actual updatedAt timestamps
                return 0;
            default:
                return 0;
        }
    });
    return sorted;
}

/**
 * Filter and sort projects
 */
export function filterAndSortProjects(
    projects: Project[],
    {
        searchQuery,
        filterStatus,
        sortOption,
    }: {
        searchQuery: string;
        filterStatus: FilterStatus;
        sortOption: SortOption;
    },
): Project[] {
    let filtered = filterProjectsBySearch(projects, searchQuery);
    filtered = filterProjectsByStatus(filtered, filterStatus);
    return sortProjects(filtered, sortOption);
}
