/* =========================================================
FILE: app/dashboard/requests/page.tsx
========================================================= */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
AlertCircle,
ArrowLeft,
Building2,
CheckCircle2,
Clock3,
Loader2,
MessageSquareText,
RefreshCw,
Search,
UserRound,
XCircle,
} from "lucide-react";

import {
  requestStatusMeta,
  requestStatusOptions,
  type RequestStatusFilter,
} from "@/lib/requests/request-status";

interface RequestItem {
id: string;
title: string;
description: string;
status:
| "PENDING"
| "ACCEPTED"
| "REJECTED"
| "CANCELLED"
| "COMPLETED";
createdAt: string;

user: {
id: string;
name: string | null;
email: string;
phone: string | null;
image: string | null;
};

business: {
id: string;
name: string;
slug: string;
phone: string | null;
whatsapp: string | null;
ownerId: string;
status: string;
isVerified: boolean;
images: {
url: string;
altText: string | null;
}[];
locations: {
city: string | null;
district: string | null;
}[];
};

service: {
id: string;
name: string;
slug: string;
} | null;
}

interface Viewer {
id: string;
role: string;
mode: "OWNER" | "USER";
}

const statusConfig = {
PENDING: {
label: requestStatusMeta.PENDING.label,
className: requestStatusMeta.PENDING.className,
icon: Clock3,
},
ACCEPTED: {
label: requestStatusMeta.ACCEPTED.label,
className: requestStatusMeta.ACCEPTED.className,
icon: CheckCircle2,
},
REJECTED: {
label: requestStatusMeta.REJECTED.label,
className: requestStatusMeta.REJECTED.className,
icon: XCircle,
},
CANCELLED: {
label: requestStatusMeta.CANCELLED.label,
className: requestStatusMeta.CANCELLED.className,
icon: XCircle,
},
COMPLETED: {
label: requestStatusMeta.COMPLETED.label,
className: requestStatusMeta.COMPLETED.className,
icon: CheckCircle2,
},
};

function formatDate(value: string) {
return new Intl.DateTimeFormat("ar-YE", {
dateStyle: "medium",
timeStyle: "short",
}).format(new Date(value));
}

export default function RequestsPage() {
const [requests, setRequests] = useState<RequestItem[]>([]);
const [viewer, setViewer] = useState<Viewer | null>(null);

const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("ALL");

const loadRequests = useCallback(async () => {
try {
setLoading(true);
setError("");


  const response = await fetch("/api/requests", {
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "تعذر تحميل الطلبات",
    );
  }

  setRequests(data.requests ?? []);
  setViewer(data.viewer ?? null);
} catch (error) {
  setError(
    error instanceof Error
      ? error.message
      : "حدث خطأ أثناء تحميل الطلبات",
  );
} finally {
  setLoading(false);
}


}, []);

useEffect(() => {
  let cancelled = false;

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/requests", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "تعذر تحميل الطلبات",
        );
      }

      if (cancelled) return;

      setRequests(data.requests ?? []);
      setViewer(data.viewer ?? null);
    } catch (error) {
      if (cancelled) return;

      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحميل الطلبات",
      );
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  void load();

  return () => {
    cancelled = true;
  };
}, []);
const filteredRequests = useMemo(() => {
const query = search.trim().toLowerCase();

return requests.filter((item) => {
  const matchesStatus =
    statusFilter === "ALL" || item.status === statusFilter;

  if (!matchesStatus) {
    return false;
  }

  if (!query) {
    return true;
  }

  return (
    item.title.toLowerCase().includes(query) ||
    item.business.name.toLowerCase().includes(query) ||
    item.service?.name.toLowerCase().includes(query) ||
    item.description.toLowerCase().includes(query) ||
    item.user.name?.toLowerCase().includes(query) ||
    item.user.email.toLowerCase().includes(query)
  );
});
}, [requests, search, statusFilter]);

const pendingCount = requests.filter(
(item) => item.status === "PENDING",
).length;

const acceptedCount = requests.filter(
(item) => item.status === "ACCEPTED",
).length;

const completedCount = requests.filter(
(item) => item.status === "COMPLETED",
).length;

const ownerMode = viewer?.mode === "OWNER";

return ( <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"> <div className="mx-auto max-w-7xl"> <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-400 p-6 text-white shadow-2xl shadow-sky-100 sm:p-9"> <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" /> <div className="absolute -bottom-28 right-16 h-80 w-80 rounded-full bg-cyan-200/20 blur-3xl" /> <div className="absolute right-1/2 top-0 h-40 w-40 rounded-full border border-white/10" />

      <div className="relative">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur">
          <MessageSquareText className="h-4 w-4" />
          {ownerMode
            ? "إدارة الطلبات الواردة"
            : "طلبات الخدمات"}
        </div>

        <div className="mt-5 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              {ownerMode
                ? "طلبات العملاء"
                : "طلباتك في مكان واحد"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-sky-50 sm:text-base">
              {ownerMode
                ? "تابع طلبات العملاء، راجع التفاصيل، واتخذ الإجراء المناسب بسرعة."
                : "تابع طلبات الخدمات التي أرسلتها وتعرّف على آخر تحديثاتها."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur">
              <p className="text-xs text-sky-100">
                إجمالي الطلبات
              </p>
              <p className="mt-1 text-2xl font-black">
                {requests.length}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur">
              <p className="text-xs text-sky-100">
                قيد الانتظار
              </p>
              <p className="mt-1 text-2xl font-black">
                {pendingCount}
              </p>
            </div>

            {ownerMode && (
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur">
                <p className="text-xs text-sky-100">
                  مكتملة
                </p>
                <p className="mt-1 text-2xl font-black">
                  {completedCount}
                </p>
              </div>
            )}

            {!ownerMode && (
              <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur">
                <p className="text-xs text-sky-100">
                  مقبولة
                </p>
                <p className="mt-1 text-2xl font-black">
                  {acceptedCount}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>

    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder={
              ownerMode
                ? "ابحث باسم العميل أو الطلب أو الخدمة..."
                : "ابحث في طلباتك..."
            }
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pr-12 pl-4 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />
        </div>

        <label className="relative block">
          <span className="sr-only">فلتر حسب الحالة</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as RequestStatusFilter)}
            className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 pr-10 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
          >
            {requestStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>

    <div className="mt-6">
      {loading ? (
        <div className="flex min-h-80 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="h-9 w-9 animate-spin text-sky-500" />
            <p className="text-sm">
              جاري تحميل الطلبات...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
          <AlertCircle className="mx-auto h-11 w-11 text-red-500" />

          <h2 className="mt-4 font-black text-red-800">
            تعذر تحميل الطلبات
          </h2>

          <p className="mt-2 text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void loadRequests()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </button>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-50">
            <MessageSquareText className="h-9 w-9 text-sky-500" />
          </div>

          <h2 className="mt-5 text-xl font-black text-slate-900">
            {search
              ? "لا توجد نتائج"
              : ownerMode
                ? "لا توجد طلبات واردة"
                : "لا توجد طلبات حتى الآن"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
            {search
              ? "جرّب تغيير كلمات البحث."
              : ownerMode
                ? "عندما يرسل أحد العملاء طلب خدمة إلى نشاطك سيظهر هنا."
                : "عندما تطلب خدمة من أحد الأنشطة ستظهر طلباتك هنا."}
          </p>

          {!search && !ownerMode && (
            <Link
              href="/businesses"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-600"
            >
              استكشف الأنشطة
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {filteredRequests.map((item) => {
            const status =
              statusConfig[item.status];

            const StatusIcon = status.icon;

            const image =
              item.business.images[0];

            return (
              <article
                key={item.id}
                className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-100/60"
              >
                <div className="h-1.5 bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-300" />

                <div className="p-5 sm:p-6">
                  <div className="flex gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-sky-50 sm:h-24 sm:w-24">
                      {image ? (
                        <Image
                          src={image.url}
                          alt={
                            image.altText ||
                            item.business.name
                          }
                          width={96}
                          height={96}
                          unoptimized
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Building2 className="h-9 w-9 text-sky-400" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-black text-slate-900">
                            {item.title}
                          </h2>

                          <p className="mt-1 font-bold text-sky-600">
                            {item.business.name}
                          </p>
                        </div>

                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black ${status.className}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status.label}
                        </span>
                      </div>

                      {ownerMode && (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                          <UserRound className="h-3.5 w-3.5 text-sky-500" />
                          {item.user.name ||
                            item.user.email}
                        </div>
                      )}

                      {item.service && (
                        <p className="mt-3 text-xs text-slate-500">
                          الخدمة:
                          <span className="mr-1 font-bold text-slate-700">
                            {item.service.name}
                          </span>
                        </p>
                      )}

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-xs text-slate-400">
                        تاريخ الطلب
                      </p>

                      <p className="mt-1 text-xs font-bold text-slate-600">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {!ownerMode && (
                        <Link
                          href={`/businesses/${item.business.slug}`}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600"
                        >
                          النشاط
                        </Link>
                      )}

                      <Link
                        href={`/dashboard/requests/${item.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-sky-600"
                      >
                        التفاصيل
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  </div>
</div>


);
}
