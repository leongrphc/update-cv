"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (page > 3) pages.push("ellipsis");

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    if (page < totalPages - 2) pages.push("ellipsis");

    pages.push(totalPages);

    return pages;
  };

  return (
    <nav className="flex items-center justify-center gap-1 mt-6" aria-label="Pagination">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Önceki sayfa"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {getPageNumbers().map((num, i) =>
        num === "ellipsis" ? (
          <span key={`e-${i}`} className="px-2 text-slate-400 dark:text-slate-500">
            ...
          </span>
        ) : (
          <button
            key={num}
            onClick={() => onPageChange(num)}
            className={`min-w-[32px] h-8 px-2 rounded-sm text-sm font-medium transition-colors ${
              num === page
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            aria-current={num === page ? "page" : undefined}
          >
            {num}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="p-2 rounded-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Sonraki sayfa"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
