"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { PaginationMeta } from "@/lib/pagination";

type PaginationProps = {
  pagination: PaginationMeta;
};

export function Pagination({ pagination }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { page, totalPages, hasNextPage, hasPrevPage, totalCount } = pagination;

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`?${params.toString()}`);
  }

  if (totalPages <= 1) return null;

  const pageNumbers: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    if (page > 3) pageNumbers.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pageNumbers.push(i);
    }
    if (page < totalPages - 2) pageNumbers.push("...");
    pageNumbers.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between py-4">
      <p className="text-sm text-gray-600">
        Page {page} of {totalPages} ({totalCount} total)
      </p>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" onClick={() => goToPage(page - 1)} disabled={!hasPrevPage}>
          Previous
        </Button>
        {pageNumbers.map((num, idx) =>
          num === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 py-1">...</span>
          ) : (
            <Button key={num} variant={num === page ? "default" : "outline"} size="sm" onClick={() => goToPage(num)}>
              {num}
            </Button>
          )
        )}
        <Button variant="outline" size="sm" onClick={() => goToPage(page + 1)} disabled={!hasNextPage}>
          Next
        </Button>
      </div>
    </div>
  );
}
