"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  jobUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = async (ids?: string[]) => {
    try {
      const body = ids ? { ids } : { all: true };
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            !ids || ids.includes(n.id) ? { ...n, isRead: true } : n
          )
        );
      }
    } catch {
      // ignore
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch {
      // ignore
    }
  };

  const clearRead = async () => {
    try {
      const res = await fetch("/api/notifications", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.filter((n) => !n.isRead));
      }
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Bildirimler
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {unreadCount > 0
              ? `${unreadCount} okunmamış bildirim`
              : "Tüm bildirimler okundu"}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markRead()}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <CheckCheck className="w-4 h-4" />
              Tümünü Okundu İşaretle
            </button>
          )}
          <button
            onClick={clearRead}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Okunanları Temizle
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="card-elevated text-center py-12">
          <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">
            Henüz bildirim yok.
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            <Link href="/job-alerts" className="text-blue-500 hover:underline">
              İş uyarıları
            </Link>{" "}
            oluşturarak yeni ilanlardan haberdar olun.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`card-elevated flex items-start gap-4 ${
                !notification.isRead
                  ? "border-l-2 border-l-blue-500"
                  : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-sm truncate ${
                      notification.isRead
                        ? "text-slate-600 dark:text-slate-400"
                        : "font-medium text-slate-900 dark:text-white"
                    }`}
                  >
                    {notification.title}
                  </h3>
                  {!notification.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {notification.message}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(notification.createdAt).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {notification.jobUrl && (
                  <a
                    href={notification.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition-colors"
                    title="İlanı Gör"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {!notification.isRead && (
                  <button
                    onClick={() => markRead([notification.id])}
                    className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-green-500 transition-colors"
                    title="Okundu İşaretle"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notification.id)}
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
