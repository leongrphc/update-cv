"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, Clock, BarChart3, Sun, Moon, MessageSquare, Linkedin, Menu, X, User, LogOut, LogIn } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useToast } from "./Toast";

interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { showToast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Fetch user session on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [pathname]); // Re-fetch when pathname changes (e.g., after login)

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      showToast("success", "Başarıyla çıkış yapıldı");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      showToast("error", "Çıkış yapılırken hata oluştu");
    }
  };

  if (isAuthPage) return null;

  const navLinks = [
    { href: "/interview", label: "Mülakat", icon: MessageSquare },
    { href: "/linkedin", label: "LinkedIn", icon: Linkedin },
    { href: "/compare", label: "Karşılaştır", icon: BarChart3 },
    { href: "/history", label: "Geçmiş", icon: Clock },
  ];

  const isActive = (href: string) =>
    href === "/interview" || href === "/linkedin"
      ? pathname.startsWith(href)
      : pathname === href;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-slate-900 dark:bg-slate-50 rounded-sm flex items-center justify-center">
              <FileText className="w-5 h-5 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">CV Optimizer</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">ATS uyumlu CV hazırlama</p>
            </div>
          </Link>

          {/* Navigation + Theme Toggle + Auth */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Nav Links */}
            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${
                    isActive(link.href)
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>

            {/* Divider */}
            <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700" />

            {/* Auth Section - Desktop */}
            <div className="hidden sm:flex items-center gap-2">
              {isLoading ? (
                <div className="w-20 h-8 bg-slate-100 dark:bg-slate-800 rounded-sm animate-pulse" />
              ) : user ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-sm">
                    <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                      {user.name || user.email.split("@")[0]}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm transition-colors"
                    title="Çıkış Yap"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition-colors"
                  >
                    Giriş Yap
                  </Link>
                  <Link
                    href="/register"
                    className="px-3 py-1.5 text-sm font-medium bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                  >
                    Kayıt Ol
                  </Link>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title={resolvedTheme === "dark" ? "Açık Tema" : "Koyu Tema"}
            >
              {resolvedTheme === "dark" ? (
                <Sun className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-2.5 rounded-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              ) : (
                <Menu className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="sm:hidden mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`px-3 py-3 text-sm font-medium rounded-sm transition-colors ${
                    isActive(link.href)
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </span>
                </Link>
              ))}

              {/* Auth Section - Mobile */}
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                {user ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-sm">
                      <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {user.name || user.email.split("@")[0]}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      Çıkış Yap
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-sm transition-colors"
                    >
                      <LogIn className="w-5 h-5" />
                      Giriş Yap
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                    >
                      Kayıt Ol
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
