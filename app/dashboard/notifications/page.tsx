
/* =========================================================
FILE: app/dashboard/notifications/page.tsx
========================================================= */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
AlertCircle,
ArrowLeft,
Bell,
BellRing,
Check,
CheckCheck,
Clock3,
Loader2,
MessageSquareText,
RefreshCw,
Settings2,
Tag,
} from "lucide-react";

interface NotificationItem {
id: string;
type:
| "SYSTEM"
| "REVIEW"
| "REQUEST"
| "OFFER"
| "BUSINESS";
title: string;
message: string;
link: string | null;
isRead: boolean;
createdAt: string;
}

const typeConfig = {
REQUEST: {
label: "طلب",
icon: MessageSquareText,
className:
"bg-sky-50 text-sky-600 border-sky-100",
},

REVIEW: {
label: "مراجعة",
icon: MessageSquareText,
className:
"bg-violet-50 text-violet-600 border-violet-100",
},

OFFER: {
label: "عرض",
icon: Tag,
className:
"bg-amber-50 text-amber-600 border-amber-100",
},

BUSINESS: {
label: "نشاط",
icon: BellRing,
className:
"bg-emerald-50 text-emerald-600 border-emerald-100",
},

SYSTEM: {
label: "النظام",
icon: Settings2,
className:
"bg-slate-50 text-slate-600 border-slate-200",
},
};

function formatDate(value: string) {
return new Intl.DateTimeFormat("ar-YE", {
dateStyle: "medium",
timeStyle: "short",
}).format(new Date(value));
}

export default function NotificationsPage() {
const [notifications, setNotifications] =
useState<NotificationItem[]>([]);

const [unreadCount, setUnreadCount] =
useState(0);

const [filter, setFilter] = useState<
"ALL" | "UNREAD"

> ("ALL");

const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [updatingId, setUpdatingId] =
useState<string | null>(null);

const loadNotifications =
useCallback(async () => {
try {
setLoading(true);
setError("");


    const response = await fetch(
      "/api/notifications",
      {
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "تعذر تحميل الإشعارات",
      );
    }

    setNotifications(
      data.notifications ?? [],
    );

    setUnreadCount(data.unreadCount ?? 0);
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "حدث خطأ أثناء تحميل الإشعارات",
    );
  } finally {
    setLoading(false);
  }
}, []);


useEffect(() => {
  const timer = window.setTimeout(() => {
    void loadNotifications();
  }, 0);

  return () => {
    window.clearTimeout(timer);
  };
}, [loadNotifications]);
async function markAsRead(id: string) {
try {
setUpdatingId(id);


  const response = await fetch(
    "/api/notifications",
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "تعذر تحديث الإشعار",
    );
  }

  setNotifications((current) =>
    current.map((item) =>
      item.id === id
        ? { ...item, isRead: true }
        : item,
    ),
  );

  setUnreadCount((count) =>
    Math.max(0, count - 1),
  );
} catch (error) {
  setError(
    error instanceof Error
      ? error.message
      : "تعذر تحديث الإشعار",
  );
} finally {
  setUpdatingId(null);
}


}

async function markAllAsRead() {
try {
setUpdatingId("all");


  const response = await fetch(
    "/api/notifications",
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        all: true,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "تعذر تحديث الإشعارات",
    );
  }

  setNotifications((current) =>
    current.map((item) => ({
      ...item,
      isRead: true,
    })),
  );

  setUnreadCount(0);
} catch (error) {
  setError(
    error instanceof Error
      ? error.message
      : "تعذر تحديث الإشعارات",
  );
} finally {
  setUpdatingId(null);
}


}

const filtered = useMemo(
() =>
filter === "UNREAD"
? notifications.filter(
(item) => !item.isRead,
)
: notifications,
[filter, notifications],
);

return ( <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"> <div className="mx-auto max-w-5xl"> <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-400 p-7 text-white shadow-2xl shadow-sky-100 sm:p-9"> <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" /> <div className="absolute -bottom-32 right-10 h-80 w-80 rounded-full bg-cyan-200/20 blur-3xl" />


      <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur">
            <Bell className="h-4 w-4" />
            مركز الإشعارات
          </div>

          <h1 className="mt-5 text-3xl font-black sm:text-4xl">
            كل جديد يصلك هنا
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-sky-50 sm:text-base">
            تابع تحديثات الطلبات والعروض
            والتنبيهات المهمة لحسابك.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
          <p className="text-xs text-sky-100">
            غير المقروء
          </p>

          <p className="mt-1 text-3xl font-black">
            {unreadCount}
          </p>
        </div>
      </div>
    </section>

    <div className="mt-6 flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFilter("ALL")}
          className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            filter === "ALL"
              ? "bg-sky-500 text-white shadow-sm"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          الكل
        </button>

        <button
          type="button"
          onClick={() =>
            setFilter("UNREAD")
          }
          className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            filter === "UNREAD"
              ? "bg-sky-500 text-white shadow-sm"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          غير المقروء
        </button>
      </div>

      <button
        type="button"
        disabled={
          updatingId === "all" ||
          unreadCount === 0
        }
        onClick={() =>
          void markAllAsRead()
        }
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {updatingId === "all" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCheck className="h-4 w-4" />
        )}
        تعليم الكل كمقروء
      </button>
    </div>

    {error && (
      <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>

        <button
          type="button"
          onClick={() =>
            void loadNotifications()
          }
          className="rounded-lg p-2 hover:bg-red-100"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>
    )}

    <div className="mt-6 space-y-3">
      {loading ? (
        <div className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="h-9 w-9 animate-spin text-sky-500" />
            <p className="text-sm">
              جاري تحميل الإشعارات...
            </p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-50">
            <Bell className="h-9 w-9 text-sky-500" />
          </div>

          <h2 className="mt-5 text-xl font-black text-slate-900">
            لا توجد إشعارات
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            ستظهر هنا التنبيهات الجديدة عندما
            تحدث في حسابك.
          </p>
        </div>
      ) : (
        filtered.map((item) => {
          const config =
            typeConfig[item.type];

          const Icon = config.icon;

          const content = (
            <div
              className={`group relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                item.isRead
                  ? "border-slate-200"
                  : "border-sky-200 bg-sky-50/30"
              }`}
            >
              {!item.isRead && (
                <span className="absolute right-0 top-0 h-full w-1 bg-sky-500" />
              )}

              <div className="flex gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${config.className}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-black text-slate-900">
                          {item.title}
                        </h2>

                        {!item.isRead && (
                          <span className="h-2 w-2 rounded-full bg-sky-500" />
                        )}
                      </div>

                      <span
                        className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${config.className}`}
                      >
                        {config.label}
                      </span>
                    </div>

                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatDate(
                        item.createdAt,
                      )}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {item.message}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {!item.isRead && (
                      <button
                        type="button"
                        disabled={
                          updatingId ===
                          item.id
                        }
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          void markAsRead(
                            item.id,
                          );
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-600 transition hover:bg-sky-100 disabled:opacity-50"
                      >
                        {updatingId ===
                        item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        تعليم كمقروء
                      </button>
                    )}

                    {item.link && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 transition group-hover:gap-2">
                        فتح التفاصيل
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );

          return item.link ? (
            <Link
              key={item.id}
              href={item.link}
              onClick={() => {
                if (!item.isRead) {
                  void markAsRead(item.id);
                }
              }}
              className="block"
            >
              {content}
            </Link>
          ) : (
            <div key={item.id}>
              {content}
            </div>
          );
        })
      )}
    </div>
  </div>
</div>


);
}
