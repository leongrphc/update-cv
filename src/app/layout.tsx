import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/lib/i18n";
import { ToastProvider } from "@/components/Toast";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DashboardShell } from "@/components/DashboardShell";

export const metadata: Metadata = {
  title: "CV Optimizer - ATS Uyumlu CV Oluşturucu",
  description: "İş ilanlarına göre CV'nizi optimize edin ve ATS sistemlerinden geçin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var isDark = theme === 'dark' ||
                    (theme === 'system' || !theme) && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  var lang = localStorage.getItem('language');
                  if (lang) document.documentElement.lang = lang;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>
              <ErrorBoundary>
                <DashboardShell>
                  {children}
                </DashboardShell>
              </ErrorBoundary>
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
