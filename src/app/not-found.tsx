"use client";

import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
        <FileQuestion className="w-8 h-8 text-slate-400 dark:text-slate-500" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
        Sayfa Bulunamadı
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
