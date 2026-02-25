"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Loader2, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/");
      } else {
        setError(data.error || "Giriş sırasında bir hata oluştu");
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
          <h1 className="text-2xl font-semibold text-slate-900">Giriş Yap</h1>
          <p className="text-slate-500 mt-2">CV Optimizer hesabınıza giriş yapın</p>
        </div>

        {/* Form */}
        <div className="card-elevated">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ornek@email.com"
                  className="input-base pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="label">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Şifrenizi girin"
                  className="input-base pl-10"
                  required
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
                  Giriş Yapılıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Hesabınız yok mu?{" "}
              <Link href="/register" className="text-slate-900 font-medium hover:underline">
                Kayıt Olun
              </Link>
            </p>
          </div>
        </div>

        {/* Skip */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            Giriş yapmadan devam et →
          </Link>
        </div>
      </div>
    </main>
  );
}
