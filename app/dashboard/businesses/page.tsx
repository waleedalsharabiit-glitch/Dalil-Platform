
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

import DashboardBusinessCard from "@/components/dashboard/dashboard-business-card";
import DashboardEmptyState from "@/components/dashboard/dashboard-empty-state";

export default async function MyBusinessesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "BUSINESS_OWNER") {
    redirect("/dashboard");
  }

  const businesses = await prisma.business.findMany({
    where: {
      ownerId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      locations: {
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
      },
      images: {
        where: {
          isPrimary: true,
        },
        take: 1,
      },
      categories: true,
      services: true,
      _count: {
        select: {
          reviews: {
            where: {
              isPublished: true,
            },
          },
        },
      },
    },
  });

  const activeCount = businesses.filter(
    (business) => business.status === "ACTIVE",
  ).length;

  const pendingCount = businesses.filter(
    (business) => business.status === "PENDING",
  ).length;

  return (
    <div className="relative min-h-[calc(100vh-72px)] overflow-hidden">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-sky-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[450px] w-[450px] rounded-full bg-cyan-100/40 blur-3xl" />

      <div className="relative px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl">
          {/* Page hero */}
          <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-500 px-6 py-7 text-white shadow-2xl shadow-sky-200/60 sm:px-8 lg:px-10">
            <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-white/10" />
            <div className="absolute -bottom-28 right-1/3 h-72 w-72 rounded-full bg-white/10" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Link
                  href="/dashboard"
                  className="mb-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-sky-50 backdrop-blur-sm transition hover:bg-white/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                  العودة إلى لوحة التحكم
                </Link>

                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
                    <Building2 className="h-6 w-6" />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-sky-100">
                      إدارة النشاط
                    </p>

                    <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                      أنشطتي التجارية
                    </h1>
                  </div>
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-sky-50">
                  أدِر جميع أنشطتك التجارية من مكان واحد، وتابع حالتها
                  وخدماتها وتقييمات العملاء بسهولة.
                </p>
              </div>

              <Link
                href="/business/create"
                className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-sky-600 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-sky-50 hover:shadow-2xl"
              >
                <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                إضافة نشاط جديد
                <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              </Link>
            </div>
          </section>

          {/* Overview cards */}
          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="group rounded-3xl border border-sky-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-100">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-500 transition-all duration-300 group-hover:bg-sky-500 group-hover:text-white">
                  <Building2 className="h-5 w-5" />
                </div>

                <span className="text-3xl font-black text-slate-900">
                  {businesses.length}
                </span>
              </div>

              <h3 className="mt-4 font-black text-slate-800">
                إجمالي الأنشطة
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                جميع الأنشطة المرتبطة بحسابك
              </p>
            </div>

            <div className="group rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-100">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 transition-all duration-300 group-hover:bg-emerald-500 group-hover:text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </div>

                <span className="text-3xl font-black text-slate-900">
                  {activeCount}
                </span>
              </div>

              <h3 className="mt-4 font-black text-slate-800">
                أنشطة نشطة
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                منشورة ومتاحة للعملاء
              </p>
            </div>

            <div className="group rounded-3xl border border-amber-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-100">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 transition-all duration-300 group-hover:bg-amber-500 group-hover:text-white">
                  <Sparkles className="h-5 w-5" />
                </div>

                <span className="text-3xl font-black text-slate-900">
                  {pendingCount}
                </span>
              </div>

              <h3 className="mt-4 font-black text-slate-800">
                قيد المراجعة
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                بانتظار موافقة الإدارة
              </p>
            </div>
          </section>

          {/* Search / toolbar */}
          <section className="mt-8">
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
              <div className="group flex min-h-[48px] flex-1 items-center gap-3 rounded-2xl bg-slate-50 px-4 text-slate-400 transition-all duration-300 focus-within:bg-sky-50 focus-within:ring-2 focus-within:ring-sky-100">
                <Search className="h-5 w-5 shrink-0 transition-colors group-focus-within:text-sky-500" />

                <span className="text-sm">
                  ابحث داخل أنشطتك...
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 rounded-2xl bg-sky-50 px-5 py-3 text-sm font-black text-sky-600">
                <Building2 className="h-4 w-4" />
                {businesses.length} نشاط
              </div>
            </div>
          </section>

          {/* Businesses */}
          <section className="mt-8 pb-10">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />

                  <span className="text-xs font-black text-sky-600">
                    قائمة الأنشطة
                  </span>
                </div>

                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  جميع أنشطتك
                </h2>
              </div>

              <span className="hidden rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 sm:inline-flex">
                {businesses.length} نشاط
              </span>
            </div>

            {businesses.length === 0 ? (
              <div className="rounded-[32px] border border-dashed border-sky-200 bg-white p-8 shadow-sm">
                <DashboardEmptyState
                  title="ابدأ بإضافة نشاطك الأول"
                  description="لم تقم بإضافة أي نشاط تجاري بعد. أضف نشاطك ليبدأ العملاء باكتشاف خدماتك والتواصل معك."
                />

                <div className="mt-5 flex justify-center">
                  <Link
                    href="/business/create"
                    className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-sky-600 to-cyan-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-sky-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
                    إضافة نشاط الآن
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {businesses.map((business) => {
                  const location = business.locations[0];
                  const image = business.images[0];

                  return (
                    <DashboardBusinessCard
                      key={business.id}
                      id={business.id}
                      name={business.name}
                      slug={business.slug}
                      status={business.status}
                      isVerified={business.isVerified}
                      city={location?.city}
                      district={location?.district}
                      imageUrl={image?.url}
                      reviewsCount={business._count.reviews}
                      rating={0}
                      categoriesCount={
                        business.categories.length
                      }
                      servicesCount={
                        business.services.length
                      }
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
