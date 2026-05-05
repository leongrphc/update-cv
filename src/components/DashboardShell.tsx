"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { CareerCoach } from "@/components/CareerCoach";

const authPages = ["/login", "/register", "/forgot-password", "/reset-password"];
const publicPrefixes = ["/share"];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = authPages.includes(pathname);
  const isPublicPage = publicPrefixes.some((p) => pathname.startsWith(p));

  if (isAuthPage || isPublicPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <main className="lg:ml-[220px] min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="p-6 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>
      <CareerCoach />
    </>
  );
}

