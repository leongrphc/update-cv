"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Palette,
  Shield,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Loader2,
  Globe,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/components/Toast";
import { useTranslation, type Language } from "@/lib/i18n";

export default function SettingsPage() {
  const { setTheme } = useTheme();
  const { showToast } = useToast();
  const { t, language, setLanguage } = useTranslation();
  const router = useRouter();
  const [activeTheme, setActiveTheme] = useState<string>("system");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme") || "system";
    setActiveTheme(stored);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success && data.user) {
          setName(data.user.name || "");
          setEmail(data.user.email || "");
          setIsLoggedIn(true);
        }
      } catch {
        // Not logged in
      } finally {
        setIsLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const handleThemeChange = (theme: string) => {
    setActiveTheme(theme);
    setTheme(theme as "light" | "dark" | "system");
  };

  const handleSaveProfile = async () => {
    if (!name.trim() || !email.trim()) {
      showToast("error", t.settings.nameEmailRequired);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("success", t.settings.profileUpdated);
      } else {
        showToast("error", data.error || t.settings.profileUpdateFailed);
      }
    } catch {
      showToast("error", t.settings.profileUpdateFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      showToast("success", t.settings.signedOut);
      router.push("/login");
    } catch {
      showToast("error", t.settings.signOutFailed);
    }
  };

  const themes = [
    { id: "light", label: t.settings.light, icon: Sun },
    { id: "dark", label: t.settings.dark, icon: Moon },
    { id: "system", label: t.settings.system, icon: Monitor },
  ];

  const languages: { id: Language; label: string; flag: string }[] = [
    { id: "tr", label: "Türkçe", flag: "🇹🇷" },
    { id: "en", label: "English", flag: "🇬🇧" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t.settings.title}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {t.settings.subtitle}
        </p>
      </div>

      <div className="space-y-4">
        {/* Profile Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <User className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t.settings.profile}</h2>
          </div>
          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : !isLoggedIn ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t.settings.signInToManage}
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.settings.displayName}
                </label>
                <input
                  type="text"
                  placeholder={t.settings.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.settings.email}
                </label>
                <input
                  type="email"
                  placeholder={t.settings.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-white/10"
                />
              </div>
              <div className="pt-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.settings.saving}
                    </>
                  ) : (
                    t.settings.saveChanges
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Palette className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t.settings.appearance}</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((theme) => {
              const Icon = theme.icon;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    activeTheme === theme.id
                      ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <Icon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {theme.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Globe className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t.settings.language}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  language === lang.id
                    ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {lang.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Account */}
        <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Shield className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t.settings.account}</h2>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t.settings.signOut}
          </button>
        </div>
      </div>
    </div>
  );
}
