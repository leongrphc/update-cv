"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Plus,
  Trash2,
  Loader2,
  MapPin,
  Briefcase,
  ToggleLeft,
  ToggleRight,
  Search,
} from "lucide-react";

interface JobAlert {
  id: string;
  keywords: string;
  location: string | null;
  jobType: string | null;
  isActive: boolean;
  lastChecked: string | null;
  createdAt: string;
  _count: { notifications: number };
}

const jobTypeLabels: Record<string, string> = {
  "full-time": "Tam Zamanlı",
  "part-time": "Yarı Zamanlı",
  contract: "Sözleşmeli",
  internship: "Staj",
};

export default function JobAlertsPage() {
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    keywords: "",
    location: "",
    jobType: "" as string,
  });

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/job-alerts");
      const data = await res.json();
      if (data.success) setAlerts(data.alerts);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const res = await fetch("/api/job-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: formData.keywords,
          location: formData.location || undefined,
          jobType: formData.jobType || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAlerts((prev) => [data.alert, ...prev]);
        setShowForm(false);
        setFormData({ keywords: "", location: "", jobType: "" });
      } else {
        setError(data.error || "Uyarı oluşturulamadı");
      }
    } catch {
      setError("Sunucuya bağlanırken bir hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (alert: JobAlert) => {
    try {
      const res = await fetch("/api/job-alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: alert.id, isActive: !alert.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alert.id ? { ...a, isActive: !a.isActive } : a))
        );
      }
    } catch {
      // ignore
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      const res = await fetch(`/api/job-alerts?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            İş Uyarıları
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Anahtar kelimeye göre yeni iş ilanları için bildirim alın.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Yeni Uyarı
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card-elevated mb-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Anahtar Kelime *</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) =>
                    setFormData({ ...formData, keywords: e.target.value })
                  }
                  placeholder="Örn: React Developer, Frontend, UI/UX"
                  className="input-base pl-10"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Konum</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="İstanbul, Uzaktan..."
                  className="input-base"
                />
              </div>
              <div>
                <label className="label">Çalışma Türü</label>
                <select
                  value={formData.jobType}
                  onChange={(e) =>
                    setFormData({ ...formData, jobType: e.target.value })
                  }
                  className="input-base"
                >
                  <option value="">Tümü</option>
                  <option value="full-time">Tam Zamanlı</option>
                  <option value="part-time">Yarı Zamanlı</option>
                  <option value="contract">Sözleşmeli</option>
                  <option value="internship">Staj</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-sm">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary flex items-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Bell className="w-4 h-4" />
                )}
                Oluştur
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Alerts List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="card-elevated text-center py-12">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">
            Henüz iş uyarısı oluşturulmadı.
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Yeni uyarı oluşturarak eşleşen iş ilanlarından haberdar olun.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`card-elevated flex items-center justify-between ${
                !alert.isActive ? "opacity-60" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-slate-900 dark:text-white truncate">
                    {alert.keywords}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {alert._count.notifications} bildirim
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {alert.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {alert.location}
                    </span>
                  )}
                  {alert.jobType && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      {jobTypeLabels[alert.jobType] || alert.jobType}
                    </span>
                  )}
                  {alert.lastChecked && (
                    <span className="text-xs text-slate-400">
                      Son kontrol: {new Date(alert.lastChecked).toLocaleDateString("tr-TR")}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => toggleActive(alert)}
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title={alert.isActive ? "Devre dışı bırak" : "Etkinleştir"}
                >
                  {alert.isActive ? (
                    <ToggleRight className="w-6 h-6 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                </button>
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
