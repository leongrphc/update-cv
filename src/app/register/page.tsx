"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Loader2, Mail, Lock, User } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/");
      } else {
        setError(data.error || "Kayıt sırasında bir hata oluştu");
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
          <h1 className="text-2xl font-semibold text-slate-900">Hesap Oluştur</h1>
          <p className="text-slate-500 mt-2">CV Optimizer&apos;a ücretsiz kayıt olun</p>
        </div>

        {/* Form */}
        <div className="card-elevated">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Ad Soyad (Opsiyonel)</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Adınız Soyadınız"
                  className="input-base pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

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
                  placeholder="En az 6 karakter"
                  className="input-base pl-10"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="label">Şifre Tekrar</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Şifrenizi tekrar girin"
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
                  Kayıt Yapılıyor...
                </>
              ) : (
                "Kayıt Ol"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Zaten hesabınız var mı?{" "}
              <Link href="/login" className="text-slate-900 font-medium hover:underline">
                Giriş Yapın
              </Link>
            </p>
          </div>
        </div>

        {/* Skip */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            Kayıt olmadan devam et →
          </Link>
        </div>
      </div>
    </main>
  );
}
