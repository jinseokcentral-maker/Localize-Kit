import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import { generatePageNumbers } from "../utils/paginationUtils";

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
  const pages = generatePageNumbers(currentPage, totalPageCount);

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

