"use client";

import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
        Bir Hata Oluştu
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
        Beklenmeyen bir hata meydana geldi. Lütfen tekrar deneyin.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
      >
        Tekrar Dene
      </button>
    </div>
  );
}
