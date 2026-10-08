
/* =========================================================
FILE: app/dashboard/requests/[id]/page.tsx
========================================================= */

"use client";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
AlertCircle,
ArrowRight,
Building2,
CalendarDays,
Check,
CheckCircle2,
Clock3,
Loader2,
Mail,
MapPin,
MessageSquareText,
Phone,
RefreshCw,
ShieldCheck,
UserRound,
X,
XCircle,
} from "lucide-react";

interface RequestData {
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
ownerId: string;
phone: string | null;
whatsapp: string | null;
website: string | null;
status: string;
isVerified: boolean;


images: {
  url: string;
  altText: string | null;
}[];

locations: {
  address: string | null;
  city: string | null;
  district: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
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
isOwner: boolean;
isUser: boolean;
isAdmin: boolean;
}

const statusConfig = {
PENDING: {
label: "قيد الانتظار",
description:
"الطلب بانتظار مراجعة صاحب النشاط.",
className:
"border-amber-200 bg-amber-50 text-amber-700",
icon: Clock3,
},

ACCEPTED: {
label: "تم قبول الطلب",
description:
"وافق صاحب النشاط على تنفيذ الطلب.",
className:
"border-sky-200 bg-sky-50 text-sky-700",
icon: CheckCircle2,
},

REJECTED: {
label: "تم رفض الطلب",
description:
"لم يتم قبول الطلب من صاحب النشاط.",
className:
"border-red-200 bg-red-50 text-red-700",
icon: XCircle,
},

CANCELLED: {
label: "تم إلغاء الطلب",
description:
"تم إلغاء الطلب ولم يعد قيد التنفيذ.",
className:
"border-slate-200 bg-slate-100 text-slate-600",
icon: XCircle,
},

COMPLETED: {
label: "اكتمل الطلب",
description:
"تم الانتهاء من تنفيذ الخدمة.",
className:
"border-emerald-200 bg-emerald-50 text-emerald-700",
icon: CheckCircle2,
},
};

function formatDate(value: string) {
return new Intl.DateTimeFormat("ar-YE", {
dateStyle: "full",
timeStyle: "short",
}).format(new Date(value));
}

export default function RequestDetailsPage() {
const params = useParams<{ id: string }>();
const requestId = params.id;

const [request, setRequest] =
useState<RequestData | null>(null);

const [viewer, setViewer] =
useState<Viewer | null>(null);

const [loading, setLoading] = useState(true);
const [updating, setUpdating] = useState(false);
const [error, setError] = useState("");
const [actionError, setActionError] =
useState("");

const loadRequest = useCallback(async () => {
try {
setLoading(true);
setError("");


  const response = await fetch(
    `/api/requests/${requestId}`,
    {
      cache: "no-store",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "تعذر تحميل تفاصيل الطلب",
    );
  }

  setRequest(data.request);
  setViewer(data.viewer);
} catch (error) {
  setError(
    error instanceof Error
      ? error.message
      : "حدث خطأ أثناء تحميل الطلب",
  );
} finally {
  setLoading(false);
}


}, [requestId]);

useEffect(() => {
  const timer = window.setTimeout(() => {
    void loadRequest();
  }, 0);

  return () => {
    window.clearTimeout(timer);
  };
}, [loadRequest]);
async function updateStatus(
status:
| "ACCEPTED"
| "REJECTED"
| "CANCELLED"
| "COMPLETED",
) {
try {
setUpdating(true);
setActionError("");


  const response = await fetch(
    `/api/requests/${requestId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "تعذر تحديث حالة الطلب",
    );
  }

  setRequest(data.request);
} catch (error) {
  setActionError(
    error instanceof Error
      ? error.message
      : "حدث خطأ أثناء تحديث الطلب",
  );
} finally {
  setUpdating(false);
}


}

if (loading) {
return ( <div className="flex min-h-[70vh] items-center justify-center px-6"> <div className="flex flex-col items-center gap-4 text-slate-500"> <Loader2 className="h-10 w-10 animate-spin text-sky-500" /> <p className="text-sm">
جاري تحميل تفاصيل الطلب... </p> </div> </div>
);
}

if (error || !request || !viewer) {
return ( <div className="px-6 py-12"> <div className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-red-50 p-10 text-center"> <AlertCircle className="mx-auto h-12 w-12 text-red-500" />

```
      <h1 className="mt-4 text-xl font-black text-red-900">
        تعذر فتح الطلب
      </h1>

      <p className="mt-2 text-sm text-red-700">
        {error || "الطلب غير موجود"}
      </p>

      <button
        type="button"
        onClick={() => void loadRequest()}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700"
      >
        <RefreshCw className="h-4 w-4" />
        إعادة المحاولة
      </button>
    </div>
  </div>
);


}

const status =
statusConfig[request.status];

const StatusIcon = status.icon;

const image = request.business.images?.[0] ?? null;
const location = request.business.locations?.[0] ?? null;

const canManageAsOwner =
(viewer.isOwner || viewer.isAdmin) &&
!["REJECTED", "CANCELLED", "COMPLETED"].includes(
request.status,
);

const canCancelAsUser =
viewer.isUser &&
["PENDING", "ACCEPTED"].includes(
request.status,
);

return ( <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8"> <div className="mx-auto max-w-6xl"> <Link
       href="/dashboard/requests"
       className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-sky-600"
     > <ArrowRight className="h-4 w-4" />
العودة إلى الطلبات </Link>


    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-400 p-6 text-white shadow-2xl shadow-sky-100 sm:p-9">
      <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-32 right-10 h-80 w-80 rounded-full bg-cyan-200/20 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur">
              <MessageSquareText className="h-4 w-4" />
              تفاصيل طلب الخدمة
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-black sm:text-4xl">
              {request.title}
            </h1>

            <p className="mt-3 flex items-center gap-2 text-sm text-sky-100">
              <CalendarDays className="h-4 w-4" />
              {formatDate(request.createdAt)}
            </p>
          </div>

          <div
            className={`inline-flex items-center gap-2 self-start rounded-2xl border bg-white px-5 py-3 text-sm font-black shadow-lg lg:self-center ${status.className}`}
          >
            <StatusIcon className="h-5 w-5" />
            {status.label}
          </div>
        </div>
      </div>
    </section>

    {actionError && (
      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
        <AlertCircle className="h-5 w-5 shrink-0" />
        {actionError}
      </div>
    )}

    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="flex items-center gap-2 font-black text-slate-900">
              <MessageSquareText className="h-5 w-5 text-sky-500" />
              تفاصيل الطلب
            </h2>
          </div>

          <div className="p-6">
            <p className="whitespace-pre-wrap text-sm leading-8 text-slate-600">
              {request.description}
            </p>

            {request.service && (
              <div className="mt-6 rounded-2xl bg-sky-50 p-5">
                <p className="text-xs font-bold text-sky-500">
                  الخدمة المطلوبة
                </p>

                <p className="mt-2 text-lg font-black text-sky-900">
                  {request.service.name}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="flex items-center gap-2 font-black text-slate-900">
              <Building2 className="h-5 w-5 text-sky-500" />
              النشاط
            </h2>
          </div>

          <div className="p-6">
            <div className="flex gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-sky-50">
                {image ? (
                 <Image
  src={image.url}
  alt={image.altText || request.business.name}
  width={80}
  height={80}
  unoptimized
  className="h-full w-full object-cover"
/>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Building2 className="h-9 w-9 text-sky-400" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">
                    {request.business.name}
                  </h3>

                  {request.business.isVerified && (
                    <ShieldCheck className="h-5 w-5 text-sky-500" />
                  )}
                </div>

                {location && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4 text-sky-500" />
                    {[location.district, location.city]
                      .filter(Boolean)
                      .join("، ")}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/businesses/${request.business.slug}`}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sky-600"
              >
                عرض النشاط
                <ArrowRight className="h-4 w-4" />
              </Link>

              {request.business.phone && (
                <a
                  href={`tel:${request.business.phone}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600"
                >
                  <Phone className="h-4 w-4" />
                  اتصال
                </a>
              )}
            </div>
          </div>
        </section>

        {viewer.isOwner || viewer.isAdmin ? (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="flex items-center gap-2 font-black text-slate-900">
                <UserRound className="h-5 w-5 text-sky-500" />
                بيانات العميل
              </h2>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-sky-100">
                  {request.user.image ? (
                   <Image
  src={request.user.image}
  alt={request.user.name || "العميل"}
  width={56}
  height={56}
  unoptimized
  className="h-full w-full object-cover"
/>
                  ) : (
                    <UserRound className="h-7 w-7 text-sky-500" />
                  )}
                </div>

                <div>
                  <p className="font-black text-slate-900">
                    {request.user.name ||
                      "مستخدم"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {request.user.email}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={`mailto:${request.user.email}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600"
                >
                  <Mail className="h-4 w-4" />
                  البريد
                </a>

                {request.user.phone && (
                  <a
                    href={`tel:${request.user.phone}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600"
                  >
                    <Phone className="h-4 w-4" />
                    الاتصال
                  </a>
                )}
              </div>
            </div>
          </section>
        ) : null}
      </div>

      <aside className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div
            className={`rounded-2xl border p-5 ${status.className}`}
          >
            <div className="flex items-start gap-3">
              <StatusIcon className="mt-0.5 h-6 w-6 shrink-0" />

              <div>
                <p className="font-black">
                  {status.label}
                </p>

                <p className="mt-1 text-sm leading-6 opacity-80">
                  {status.description}
                </p>
              </div>
            </div>
          </div>

          {canManageAsOwner && (
            <div className="mt-5 space-y-3">
              {request.status === "PENDING" && (
                <>
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() =>
                      void updateStatus(
                        "ACCEPTED",
                      )
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-sky-100 transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updating ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Check className="h-5 w-5" />
                    )}
                    قبول الطلب
                  </button>

                  <button
                    type="button"
                    disabled={updating}
                    onClick={() =>
                      void updateStatus(
                        "REJECTED",
                      )
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <X className="h-5 w-5" />
                    رفض الطلب
                  </button>
                </>
              )}

              {request.status === "ACCEPTED" && (
                <>
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() =>
                      void updateStatus(
                        "COMPLETED",
                      )
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {updating ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5" />
                    )}
                    إكمال الطلب
                  </button>

                  <button
                    type="button"
                    disabled={updating}
                    onClick={() =>
                      void updateStatus(
                        "CANCELLED",
                      )
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-black text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    <X className="h-5 w-5" />
                    إلغاء الطلب
                  </button>
                </>
              )}
            </div>
          )}

          {canCancelAsUser && (
            <button
              type="button"
              disabled={updating}
              onClick={() =>
                void updateStatus("CANCELLED")
              }
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              {updating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <X className="h-5 w-5" />
              )}
              إلغاء الطلب
            </button>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-black text-slate-900">
            مسار الطلب
          </h2>

          <div className="mt-5 space-y-4">
            {[
              {
                label: "إرسال الطلب",
                active: true,
              },
              {
                label: "مراجعة صاحب النشاط",
                active: [
                  "ACCEPTED",
                  "REJECTED",
                  "COMPLETED",
                ].includes(
                  request.status,
                ),
              },
              {
                label: "تنفيذ الخدمة",
                active: [
                  "COMPLETED",
                ].includes(
                  request.status,
                ),
              },
            ].map((step, index) => (
              <div
                key={step.label}
                className="flex items-center gap-3"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    step.active
                      ? "bg-sky-500 text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {step.active ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-black">
                      {index + 1}
                    </span>
                  )}
                </div>

                <span
                  className={`text-sm ${
                    step.active
                      ? "font-bold text-slate-800"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  </div>
</div>


);
}
