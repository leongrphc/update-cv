"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        if (data.devResetLink) {
          setDevResetLink(data.devResetLink);
        }
      } else {
        setError(data.error || "İşlem sırasında bir hata oluştu");
      }
    } catch {
      setError("Sunucuya bağlanırken bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 dark:bg-white rounded-sm mb-4">
            <FileText className="w-6 h-6 text-white dark:text-slate-900" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Şifremi Unuttum</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            E-posta adresinizi girin, size sıfırlama bağlantısı gönderelim.
          </p>
        </div>

        {/* Form */}
        <div className="card-elevated">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                E-posta Gönderildi
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Eğer bu e-posta adresi kayıtlıysa, şifre sıfırlama bağlantısı
                gönderildi. E-posta kutunuzu kontrol edin.
              </p>

              {devResetLink && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-sm mb-4">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">
                    Geliştirme Modu
                  </p>
                  <a
                    href={devResetLink}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    {devResetLink}
                  </a>
                </div>
              )}

              <Link
                href="/login"
                className="btn-primary inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Giriş Sayfasına Dön
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    className="input-base pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-sm">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  "Sıfırlama Bağlantısı Gönder"
                )}
              </button>
            </form>
          )}
        </div>

        {/* Back to login */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    </main>
  );
}
