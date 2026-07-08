import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "./ui/pagination";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const PacificPagination: React.FC<PaginationProps> = ({
  totalPages,
  currentPage,
  onPageChange,
}) => {
  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(
          1,
          "...",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }
    return pages;
  };

  const handlePageClick = (page: number | "...") => {
    if (page === "..." || page === currentPage) return;
    onPageChange(page as number);
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink
            onClick={() => {
              if (currentPage === 1) return;
              handlePageClick(currentPage - 1);
            }}
            className={cn(
              "border border-[#44B6CA] hover:bg-[#44B6CA] hover:text-white",
              currentPage === 1 &&
                "cursor-not-allowed bg-[#E3E3E3] border-0 pointer-events-none"
            )}
          >
            <ChevronLeft
              className={cn("h-4 w-4", currentPage === 1 && "text-white")}
            />
          </PaginationLink>
        </PaginationItem>

        {getPageNumbers().map((page, index) => (
          <PaginationItem key={index}>
            <PaginationLink
              onClick={() => handlePageClick(page)}
              className={cn(
                "border border-[#44B6CA] hover:bg-[#44B6CA] hover:text-white",
                page === currentPage
                  ? "bg-[#44B6CA] text-white"
                  : "text-[#44B6CA]"
              )}
            >
              {page === "..." ? "..." : page}
            </PaginationLink>
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationLink
            onClick={() => {
              if (totalPages === currentPage) return;
              handlePageClick(currentPage + 1);
            }}
            className={cn(
              "border border-[#44B6CA] hover:bg-[#44B6CA] hover:text-white",
              currentPage === totalPages &&
                "cursor-not-allowed bg-[#E3E3E3] border-0 pointer-events-none"
            )}
          >
            <ChevronRight
              className={cn("h-4 w-4", currentPage === totalPages && "text-white")}
            />
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default PacificPagination;