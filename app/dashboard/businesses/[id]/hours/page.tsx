
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Clock3,
  Settings2,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

import BusinessHoursManager from "@/components/business/business-hours-manager";

interface BusinessHoursPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BusinessHoursPage({
  params,
}: BusinessHoursPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (
    session.user.role !== "BUSINESS_OWNER" &&
    session.user.role !== "ADMIN" &&
    session.user.role !== "SUPER_ADMIN"
  ) {
    redirect("/dashboard");
  }

  const { id } = await params;

  const business = await prisma.business.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
      hours: {
        orderBy: {
          dayOfWeek: "asc",
        },
        select: {
          id: true,
          dayOfWeek: true,
          opensAt: true,
          closesAt: true,
          isClosed: true,
        },
      },
    },
  });

  if (!business) {
    notFound();
  }

  const isAdmin =
    session.user.role === "ADMIN" ||
    session.user.role === "SUPER_ADMIN";

  if (!isAdmin && business.ownerId !== session.user.id) {
    redirect("/dashboard/businesses");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f0f9ff]">
      {/* Decorative background */}
      <div className="pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 bottom-20 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/dashboard"
            className="font-medium text-slate-500 transition hover:text-sky-600"
          >
            لوحة التحكم
          </Link>

          <ArrowRight className="h-4 w-4 text-slate-300" />

          <Link
            href="/dashboard/businesses"
            className="font-medium text-slate-500 transition hover:text-sky-600"
          >
            أنشطتي
          </Link>

          <ArrowRight className="h-4 w-4 text-slate-300" />

          <Link
            href={`/dashboard/businesses/${business.id}`}
            className="font-medium text-slate-500 transition hover:text-sky-600"
          >
            {business.name}
          </Link>

          <ArrowRight className="h-4 w-4 text-slate-300" />

          <span className="font-bold text-slate-800">
            ساعات العمل
          </span>
        </div>

        {/* Hero */}
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-l from-sky-600 via-sky-500 to-cyan-500 p-6 text-white shadow-xl shadow-sky-200 sm:p-8">
          <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 right-20 h-48 w-48 rounded-full bg-cyan-300/20 blur-2xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                  <Clock3 className="h-6 w-6" />
                </div>

                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
                  إدارة النشاط
                </span>
              </div>

              <h1 className="text-2xl font-black sm:text-3xl">
                ساعات عمل {business.name}
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-7 text-sky-50 sm:text-base">
                حدّد أوقات فتح وإغلاق نشاطك حتى يعرف العملاء
                متى يمكنهم زيارتك أو التواصل معك.
              </p>
            </div>

            <Link
              href={`/dashboard/businesses/${business.id}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-sky-600 shadow-lg transition hover:-translate-y-0.5 hover:bg-sky-50"
            >
              <Building2 className="h-4 w-4" />
              تفاصيل النشاط
            </Link>
          </div>
        </section>

        {/* Manager */}
    
<BusinessHoursManager
  businessId={business.id}
  initialHours={business.hours.map((hour) => ({
    id: hour.id,
    dayOfWeek: hour.dayOfWeek,
    opensAt: hour.opensAt ?? "08:00",
    closesAt: hour.closesAt ?? "22:00",
    isClosed: hour.isClosed,
  }))}
/>



        {/* Tip */}
        <div className="mt-6 flex gap-4 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
            <Settings2 className="h-5 w-5" />
          </div>

          <div>
            <h3 className="font-bold text-slate-900">
              نصيحة
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              حافظ على تحديث ساعات العمل باستمرار، خصوصًا في
              أيام العطل والمناسبات، حتى تظهر المعلومات الصحيحة
              للعملاء.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
