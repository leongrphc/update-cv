"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FileText, Loader2, Lock, CheckCircle, ArrowLeft } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Geçersiz sıfırlama bağlantısı. Lütfen yeni bir bağlantı isteyin.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
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
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 rounded-sm mb-4">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Yeni Şifre Belirle</h1>
          <p className="text-slate-500 mt-2">Hesabınız için yeni bir şifre oluşturun.</p>
        </div>

        {/* Form */}
        <div className="card-elevated">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-slate-900 mb-2">
                Şifre Güncellendi
              </h2>
              <p className="text-sm text-slate-500 mb-4">
                Şifreniz başarıyla değiştirildi. 3 saniye içinde giriş
                sayfasına yönlendirileceksiniz.
              </p>
              <Link
                href="/login"
                className="btn-primary inline-flex items-center gap-2"
              >
                Giriş Yap
              </Link>
            </div>
          ) : token ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Yeni Şifre</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="En az 8 karakter"
                    className="input-base pl-10"
                    required
                    minLength={8}
                    maxLength={128}
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  En az 8 karakter, bir büyük harf, bir küçük harf ve bir rakam
                </p>
              </div>

              <div>
                <label className="label">Şifre Tekrar</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Şifrenizi tekrar girin"
                    className="input-base pl-10"
                    required
                    minLength={8}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-sm">
                  <p className="text-sm text-red-700">{error}</p>
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
                    Güncelleniyor...
                  </>
                ) : (
                  "Şifreyi Güncelle"
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <Link
                href="/forgot-password"
                className="btn-primary inline-flex items-center gap-2"
              >
                Yeni Bağlantı İste
              </Link>
            </div>
          )}
        </div>

        {/* Back to login */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
            <p className="text-sm text-slate-500 mt-2">Yükleniyor...</p>
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
