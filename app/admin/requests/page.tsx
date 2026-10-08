
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  XCircle,
} from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const statusConfig = {
  PENDING: {
    label: "قيد الانتظار",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock3,
  },
  ACCEPTED: {
    label: "مقبول",
    className: "bg-sky-50 text-sky-700 border-sky-200",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "مرفوض",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: XCircle,
  },
  CANCELLED: {
    label: "ملغي",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    icon: XCircle,
  },
  COMPLETED: {
    label: "مكتمل",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
} as const;

export default async function AdminRequestsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "SUPER_ADMIN"
  ) {
    redirect("/dashboard");
  }

  const [requests, total, pending, accepted, completed] =
    await Promise.all([
      prisma.serviceRequest.findMany({
        take: 50,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      prisma.serviceRequest.count(),

      prisma.serviceRequest.count({
        where: {
          status: "PENDING",
        },
      }),

      prisma.serviceRequest.count({
        where: {
          status: "ACCEPTED",
        },
      }),

      prisma.serviceRequest.count({
        where: {
          status: "COMPLETED",
        },
      }),
    ]);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f0f9ff] px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black tracking-[0.2em] text-sky-600">
                REQUEST CENTER
              </p>

              <h1 className="mt-2 text-3xl font-black text-slate-900">
                إدارة طلبات الخدمات
              </h1>

              <p className="mt-2 text-sm leading-7 text-slate-500">
                متابعة جميع الطلبات بين المستخدمين وأصحاب الأنشطة.
              </p>
            </div>

            <Link
              href="/admin"
              className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-sky-200 hover:text-sky-600"
            >
              لوحة الإدارة
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStat
            label="كل الطلبات"
            value={total}
            icon={<MessageSquareText className="h-5 w-5" />}
            className="bg-sky-50 text-sky-600"
          />

          <AdminStat
            label="قيد الانتظار"
            value={pending}
            icon={<Clock3 className="h-5 w-5" />}
            className="bg-amber-50 text-amber-600"
          />

          <AdminStat
            label="مقبولة"
            value={accepted}
            icon={<CheckCircle2 className="h-5 w-5" />}
            className="bg-blue-50 text-blue-600"
          />

          <AdminStat
            label="مكتملة"
            value={completed}
            icon={<CheckCircle2 className="h-5 w-5" />}
            className="bg-emerald-50 text-emerald-600"
          />
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-7">
            <h2 className="font-black text-slate-900">
              آخر الطلبات
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              أحدث 50 طلبًا في المنصة.
            </p>
          </div>

          {requests.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-50 text-sky-500">
                <MessageSquareText className="h-7 w-7" />
              </div>

              <h3 className="mt-5 font-black text-slate-800">
                لا توجد طلبات حتى الآن
              </h3>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.map((request) => {
                const config =
                  statusConfig[request.status];

                const StatusIcon = config.icon;

                return (
                  <Link
                    key={request.id}
                    href={`/dashboard/requests/${request.id}`}
                    className="group block px-5 py-5 transition hover:bg-sky-50/50 sm:px-7"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-black text-slate-900 transition group-hover:text-sky-700">
                            {request.title}
                          </h3>

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black ${config.className}`}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {config.label}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                          <span>
                            المستخدم:{" "}
                            <strong className="text-slate-700">
                              {request.user.name ||
                                request.user.email}
                            </strong>
                          </span>

                          <span>
                            النشاط:{" "}
                            <strong className="text-slate-700">
                              {request.business.name}
                            </strong>
                          </span>

                          {request.service && (
                            <span>
                              الخدمة:{" "}
                              <strong className="text-slate-700">
                                {request.service.name}
                              </strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-left">
                          <p className="text-[11px] text-slate-400">
                            صاحب النشاط
                          </p>

                          <p className="mt-1 text-xs font-bold text-slate-600">
                            {request.business.owner.name ||
                              request.business.owner.email}
                          </p>
                        </div>

                        <ArrowLeft className="h-5 w-5 text-slate-300 transition group-hover:-translate-x-1 group-hover:text-sky-500" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function AdminStat({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  className: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${className}`}
        >
          {icon}
        </div>

        <span className="text-3xl font-black text-slate-900">
          {value}
        </span>
      </div>

      <p className="mt-4 text-sm font-bold text-slate-500">
        {label}
      </p>
    </div>
  );
}
