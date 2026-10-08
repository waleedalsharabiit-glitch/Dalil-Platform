"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BellRing,
  Check,
  Clock3,
  Loader2,
  MessageSquareText,
  Tag,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: "SYSTEM" | "REVIEW" | "REQUEST" | "OFFER" | "BUSINESS";
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const icons = {
  REQUEST: MessageSquareText,
  REVIEW: MessageSquareText,
  OFFER: Tag,
  BUSINESS: BellRing,
  SYSTEM: Bell,
};

function relativeDate(value: string) {
  const diff = Date.now() - new Date(value).getTime();

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "الآن";
  }

  if (minutes < 60) {
    return `منذ ${minutes} دقيقة`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `منذ ${hours} ساعة`;
  }

  const days = Math.floor(hours / 24);

  return `منذ ${days} يوم`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/notifications", {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setItems((data.notifications ?? []).slice(0, 6));
      setUnread(data.unreadCount ?? 0);
    } catch {
      // تجاهل أخطاء التحديث الدوري للإشعارات
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load();
    }, 0);

    const interval = window.setInterval(() => {
      void load();
    }, 30000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(interval);
    };
  }, [load]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  async function markRead(notification: NotificationItem) {
    if (notification.isRead) {
      return;
    }

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: notification.id,
        }),
      });

      if (!response.ok) {
        return;
      }

      setItems((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, isRead: true }
            : item,
        ),
      );

      setUnread((value) => Math.max(0, value - 1));
    } catch {
      // تجاهل الخطأ مع إبقاء الواجهة كما هي
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);

          if (!open) {
            void load();
          }
        }}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600"
        aria-label="الإشعارات"
      >
        <Bell className="h-5 w-5" />

        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-14 z-50 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/70">
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-l from-sky-50 to-white px-4 py-4">
            <div>
              <h3 className="font-black text-slate-900">
                الإشعارات
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                {unread > 0
                  ? `${unread} إشعار غير مقروء`
                  : "لا توجد إشعارات جديدة"}
              </p>
            </div>

            <BellRing className="h-5 w-5 text-sky-500" />
          </div>

          <div className="max-h-[390px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
              </div>
            ) : items.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Bell className="mx-auto h-9 w-9 text-slate-300" />

                <p className="mt-3 text-sm font-bold text-slate-500">
                  لا توجد إشعارات
                </p>
              </div>
            ) : (
              items.map((item) => {
                const Icon = icons[item.type];

                const body = (
                  <div
                    className={`flex gap-3 border-b border-slate-100 px-4 py-4 transition hover:bg-slate-50 ${
                      !item.isRead ? "bg-sky-50/50" : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                      <Icon className="h-[18px] w-[18px]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-black text-slate-800">
                          {item.title}
                        </p>

                        {!item.isRead && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                        )}
                      </div>

                      <p className="mt-1 line-clamp-2 text-xs leading-6 text-slate-500">
                        {item.message}
                      </p>

                      <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock3 className="h-3 w-3" />

                        {relativeDate(item.createdAt)}
                      </div>
                    </div>
                  </div>
                );

                return item.link ? (
                  <Link
                    key={item.id}
                    href={item.link}
                    onClick={() => {
                      void markRead(item);
                      setOpen(false);
                    }}
                  >
                    {body}
                  </Link>
                ) : (
                  <div key={item.id}>
                    {body}

                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={() => void markRead(item)}
                        className="mx-4 mb-3 inline-flex items-center gap-1 text-[11px] font-bold text-sky-600"
                      >
                        <Check className="h-3 w-3" />
                        تعليم كمقروء
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50 p-3">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-xs font-black text-sky-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-sky-50 hover:ring-sky-200"
            >
              عرض جميع الإشعارات
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}