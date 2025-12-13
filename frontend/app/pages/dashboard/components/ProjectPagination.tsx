import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";

interface ProjectPaginationProps {
  pageIndex: number;
  totalPageCount: number;
  onPageChange: (pageIndex: number) => void;
}

export function ProjectPagination({
  pageIndex,
  totalPageCount,
  onPageChange,
}: ProjectPaginationProps) {
  const currentPage = pageIndex + 1;
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
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPageCount - 1, currentPage + 1);

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

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={(e) => {
              e.preventDefault();
              if (pageIndex > 0) {
                onPageChange(pageIndex - 1);
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
        {pages.map((page, idx) => (
          <PaginationItem key={idx}>
            {page === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(page - 1);
                }}
                isActive={page === currentPage}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            onClick={(e) => {
              e.preventDefault();
              const nextPage = pageIndex + 1;
              if (nextPage < totalPageCount) {
                onPageChange(nextPage);
              }
            }}
            className={
              pageIndex + 1 >= totalPageCount
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

