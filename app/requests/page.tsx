import Link from "next/link";
import { ArrowLeft, ClipboardList, Filter } from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import RequestStatusActions from "@/components/requests/request-status-actions";
import {
  requestStatusMeta,
  requestStatusOptions,
  type RequestStatusFilter,
} from "@/lib/requests/request-status";

interface MyRequestsPageProps {
  searchParams?: Promise<{ status?: string }>;
}

export default async function MyRequestsPage({
  searchParams,
}: MyRequestsPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = searchParams ? await searchParams : {};
  const selectedStatus =
    (params.status as RequestStatusFilter | undefined) ?? "ALL";

  const requests = await prisma.serviceRequest.findMany({
    where: {
      userId: session.user.id,
      ...(selectedStatus !== "ALL"
        ? {
            status: selectedStatus,
          }
        : {}),
    },
    include: {
      business: { select: { name: true, slug: true } },
      service: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusSummary = Object.entries(requestStatusMeta)
    .filter(([key]) => key !== "ALL")
    .map(([key, config]) => ({
      key: key as Exclude<RequestStatusFilter, "ALL">,
      label: config.label,
      count: requests.filter((request) => request.status === key).length,
    }));

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="rounded-[2rem] bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-400 p-6 text-white shadow-2xl shadow-sky-100">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-black text-white sm:text-3xl">
                <ClipboardList className="text-white" />
                طلباتي
              </h1>
              <p className="mt-2 text-sm text-sky-50">
                تابع حالة الطلبات التي أرسلتها إلى الأنشطة.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {statusSummary.map((item) => (
                <div
                  key={item.key}
                  className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-center backdrop-blur"
                >
                  <div className="text-[10px] text-sky-100">{item.label}</div>
                  <div className="mt-1 text-lg font-black">{item.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-500">تصفية:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {requestStatusOptions.map((option) => {
                const isActive = selectedStatus === option.value;

                return (
                  <Link
                    key={option.value}
                    href={
                      option.value === "ALL"
                        ? "/requests"
                        : `/requests?status=${option.value}`
                    }
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                      isActive
                        ? "border-sky-200 bg-sky-50 text-sky-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-600"
                    }`}
                  >
                    {option.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {requests.length ? (
          <div className="mt-7 space-y-4">
            {requests.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-slate-900">{item.title}</h2>
                    <Link
                      href={`/businesses/${item.business.slug}`}
                      className="mt-1 inline-block text-sm font-semibold text-sky-700 hover:underline"
                    >
                      {item.business.name}
                    </Link>
                    {item.service && (
                      <p className="mt-1 text-xs text-slate-500">
                        الخدمة: {item.service.name}
                      </p>
                    )}
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold ${requestStatusMeta[item.status].className}`}
                  >
                    {requestStatusMeta[item.status].label}
                  </span>
                </div>

                {item.description && (
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                    {item.description}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <time className="text-xs text-slate-400">
                    {item.createdAt.toLocaleDateString("ar-SA")}
                  </time>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/requests/${item.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:underline"
                    >
                      التفاصيل
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </Link>

                    {item.status === "PENDING" && (
                      <RequestStatusActions
                        requestId={item.id}
                        statuses={[{ value: "CANCELLED", label: "إلغاء الطلب" }]}
                      />
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <section className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-4 font-bold text-slate-800">
              {selectedStatus === "ALL"
                ? "لا توجد طلبات حتى الآن"
                : "لا توجد طلبات في هذه الحالة"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {selectedStatus === "ALL"
                ? "أرسل طلب خدمة من صفحة النشاط لمتابعته هنا."
                : "جرّب تغيير حالة التصفية لمشاهدة الطلبات الأخرى."}
            </p>
            {selectedStatus !== "ALL" && (
              <Link
                href="/requests"
                className="mt-5 inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white"
              >
                عرض الكل
              </Link>
            )}
            {selectedStatus === "ALL" && (
              <Link
                href="/businesses"
                className="mt-5 inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white"
              >
                اكتشف الأنشطة
              </Link>
            )}
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
