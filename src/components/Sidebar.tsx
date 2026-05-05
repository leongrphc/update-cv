"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import {
  LayoutDashboard,
  FileText,
  FilePlus2,
  Target,
  Briefcase,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  MessageSquare,
  Linkedin,
  BarChart3,
  Clock,
  GitBranch,
  Bell,
  BellRing,
} from "lucide-react";

interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
}

const navConfig = [
  { href: "/", key: "dashboard" as const, icon: LayoutDashboard },
  { href: "/my-cvs", key: "myCvs" as const, icon: FileText },
  { href: "/create-cv", key: "createCv" as const, icon: FilePlus2 },
  { href: "/optimize", key: "optimize" as const, icon: Target },
  { href: "/find-jobs", key: "findJobs" as const, icon: Briefcase },
  { href: "/interview", key: "interview" as const, icon: MessageSquare },
  { href: "/linkedin", key: "linkedin" as const, icon: Linkedin },
  { href: "/compare", key: "compare" as const, icon: BarChart3 },
  { href: "/history", key: "history" as const, icon: Clock },
  { href: "/cv-versions", key: "versions" as const, icon: GitBranch },
  { href: "/job-alerts", key: "jobAlerts" as const, icon: BellRing },
  { href: "/notifications", key: "notifications" as const, icon: Bell },
  { href: "/settings", key: "settings" as const, icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        }
      } catch {
        // User not logged in
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        if (data.success) setUnreadCount(data.unreadCount);
      } catch {
        // ignore
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
    } catch {
      // Logout failed
    }
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-6 py-6 pb-8">
        <Link href="/" className="block">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            CV Optimizer
          </h1>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navConfig.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const label = t.sidebar[item.key];
            const showBadge = item.href === "/notifications" && unreadCount > 0;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    active
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  <span className="flex-1">{label}</span>
                  {showBadge && (
                    <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        {isLoading ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="w-20 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        ) : user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                {user.name || user.email.split("@")[0]}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              title={t.sidebar.logout}
              aria-label={t.sidebar.logout}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t.sidebar.signIn}
            </span>
          </Link>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white dark:bg-slate-900 rounded-lg shadow-md border border-slate-200 dark:border-slate-700"
        aria-label={t.sidebar.menu}
      >
        {isMobileOpen ? (
          <X className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        ) : (
          <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-[220px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-40 transition-transform duration-200 lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
