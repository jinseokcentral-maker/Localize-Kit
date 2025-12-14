/**
 * Pagination utility functions
 */

/**
 * Generate page numbers array for pagination display
 * Returns array of page numbers and "ellipsis" markers
 * @param currentPage - Current page number (1-based)
 * @param totalPageCount - Total number of pages
 * @returns Array of page numbers or "ellipsis" strings
 */
export function generatePageNumbers(
    currentPage: number,
    totalPageCount: number,
): (number | "ellipsis")[] {
    const pages: (number | "ellipsis")[] = [];

    if (totalPageCount <= 7) {
        // Show all pages if total is small
        for (let i = 1; i <= totalPageCount; i++) {
            pages.push(i);
        }
    } else {
        // Always show first page
        pages.push(1);

        if (currentPage > 3) {
            pages.push("ellipsis");
        }

        // Show pages around current
        // For page 1, show 1, 2, 3
        // For other pages, show current-1, current, current+1
        const start = currentPage === 1 ? 2 : Math.max(2, currentPage - 1);
        const end = currentPage === 1
            ? Math.min(3, totalPageCount - 1)
            : Math.min(totalPageCount - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (currentPage < totalPageCount - 2) {
            pages.push("ellipsis");
        }

        // Always show last page
        if (totalPageCount > 1) {
            pages.push(totalPageCount);
        }
    }

    return pages;
}
