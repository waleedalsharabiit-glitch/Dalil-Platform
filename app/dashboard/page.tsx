
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  Heart,
  Plus,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

import DashboardStatCard from "@/components/dashboard/dashboard-stat-card";
import DashboardBusinessCard from "@/components/dashboard/dashboard-business-card";
import DashboardEmptyState from "@/components/dashboard/dashboard-empty-state";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      role: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  const isOwner = user.role === "BUSINESS_OWNER";

  const businesses = isOwner
    ? await prisma.business.findMany({
        where: {
          ownerId: user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
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
      })
    : [];

  const [
    businessesCount,
    activeBusinessesCount,
    pendingBusinessesCount,
    reviewsCount,
    favoritesCount,
    requestsCount,
  ] = isOwner
    ? await Promise.all([
        prisma.business.count({
          where: {
            ownerId: user.id,
          },
        }),
        prisma.business.count({
          where: {
            ownerId: user.id,
            status: "ACTIVE",
          },
        }),
        prisma.business.count({
          where: {
            ownerId: user.id,
            status: "PENDING",
          },
        }),
        prisma.review.count({
          where: {
            business: {
              ownerId: user.id,
            },
            isPublished: true,
          },
        }),
        prisma.favorite.count({
          where: {
            userId: user.id,
          },
        }),
        prisma.serviceRequest.count({
          where: {
            business: {
              ownerId: user.id,
            },
          },
        }),
      ])
    : await Promise.all([
        Promise.resolve(0),
        Promise.resolve(0),
        Promise.resolve(0),
        prisma.review.count({
          where: {
            userId: user.id,
          },
        }),
        prisma.favorite.count({
          where: {
            userId: user.id,
          },
        }),
        prisma.serviceRequest.count({
          where: {
            userId: user.id,
          },
        }),
      ]);

  const displayName = user.name || "مستخدم";

  return (
    <div className="relative min-h-[calc(100vh-72px)] overflow-hidden">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-sky-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-40 top-[500px] h-[450px] w-[450px] rounded-full bg-cyan-100/40 blur-3xl" />

      <div className="relative px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-7xl">
          {/* Welcome */}
          <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-500 px-6 py-7 text-white shadow-2xl shadow-sky-200/70 sm:px-8 sm:py-9 lg:px-10">
            <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
            <div className="absolute -bottom-28 right-1/3 h-72 w-72 rounded-full bg-white/10" />
            <div className="absolute right-10 top-10 h-20 w-20 rounded-full border border-white/10" />
            <div className="absolute right-20 top-20 h-10 w-10 rounded-full border border-white/10" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold backdrop-blur-md">
                  <Sparkles className="h-4 w-4" />
                  {isOwner
                    ? "مساحة إدارة نشاطك"
                    : "مرحبًا بك في دليل"}
                </div>

                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  أهلاً {displayName} 👋
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-sky-50 sm:text-base">
                  {isOwner
                    ? "كل أدوات نشاطك التجاري أمامك. تابع الأداء، أدِر بياناتك، وابقَ قريبًا من عملائك."
                    : "اكتشف الأماكن والخدمات التي تحتاجها، واحفظ المفضلة وتابع تفاعلاتك من مكان واحد."}
                </p>
              </div>

              {isOwner && (
                <Link
                  href="/business/create"
                  className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-black text-sky-600 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-sky-50 hover:shadow-2xl"
                >
                  <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                  إضافة نشاط جديد
                  <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                </Link>
              )}
            </div>
          </section>

          {/* Stats */}
          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {isOwner ? (
              <>
                <DashboardStatCard
                  title="إجمالي الأنشطة"
                  value={businessesCount}
                  description="جميع الأنشطة التي تملكها"
                  icon={Building2}
                  tone="sky"
                />

                <DashboardStatCard
                  title="الأنشطة النشطة"
                  value={activeBusinessesCount}
                  description="منشورة ومتاحة للجمهور"
                  icon={BadgeCheck}
                  tone="green"
                />

                <DashboardStatCard
                  title="قيد المراجعة"
                  value={pendingBusinessesCount}
                  description="بانتظار مراجعة الإدارة"
                  icon={ClipboardList}
                  tone="amber"
                />

                <DashboardStatCard
                  title="التقييمات"
                  value={reviewsCount}
                  description="التقييمات المنشورة"
                  icon={Star}
                  tone="violet"
                />
              </>
            ) : (
              <>
                <DashboardStatCard
                  title="المفضلة"
                  value={favoritesCount}
                  description="الأنشطة التي حفظتها"
                  icon={Heart}
                  tone="rose"
                />

                <DashboardStatCard
                  title="تقييماتي"
                  value={reviewsCount}
                  description="التقييمات التي أضفتها"
                  icon={Star}
                  tone="amber"
                />

                <DashboardStatCard
                  title="طلباتي"
                  value={requestsCount}
                  description="طلبات الخدمات"
                  icon={ClipboardList}
                  tone="sky"
                />

                <DashboardStatCard
                  title="أنشطتي"
                  value={businessesCount}
                  description="الأنشطة المرتبطة بحسابك"
                  icon={Building2}
                  tone="green"
                />
              </>
            )}
          </section>

          {/* Business section */}
          {isOwner && (
            <section className="mt-10">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    <span className="text-xs font-black text-sky-600">
                      إدارة الأنشطة
                    </span>
                  </div>

                  <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                    أنشطتك التجارية
                  </h2>

                  <p className="mt-1.5 text-sm text-slate-500">
                    تابع حالة أنشطتك وأدِر بياناتها من مكان واحد.
                  </p>
                </div>

                <Link
                  href="/dashboard/businesses"
                  className="group hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-sky-600 transition hover:bg-sky-50 sm:flex"
                >
                  عرض الكل
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                </Link>
              </div>

              {businesses.length === 0 ? (
                <DashboardEmptyState
                  title="ابدأ بإضافة نشاطك الأول"
                  description="أضف نشاطك التجاري إلى دليل ليتمكن العملاء من العثور عليك والتواصل معك."
                />
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
                        categoriesCount={business.categories.length}
                        servicesCount={business.services.length}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Quick actions */}
          <section className="mt-10">
            <div className="mb-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                <span className="text-xs font-black text-sky-600">
                  الوصول السريع
                </span>
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                ماذا تريد أن تفعل؟
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {isOwner && (
                <>
                  <Link
                    href="/business/create"
                    className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 to-cyan-500 p-5 text-white shadow-xl shadow-sky-200/60 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-sky-200"
                  >
                    <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-white/10" />

                    <div className="relative">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                        <Plus className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" />
                      </div>

                      <h3 className="mt-5 font-black">
                        إضافة نشاط
                      </h3>

                      <p className="mt-1 text-xs text-sky-50">
                        أضف نشاطًا جديدًا إلى دليل
                      </p>

                      <ArrowLeft className="mt-4 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/businesses"
                    className="group rounded-3xl border border-sky-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-100"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-500 transition-all duration-300 group-hover:bg-sky-500 group-hover:text-white">
                      <Building2 className="h-5 w-5" />
                    </div>

                    <h3 className="mt-5 font-black text-slate-900">
                      إدارة أنشطتي
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      راجع جميع أنشطتك التجارية
                    </p>

                    <ArrowLeft className="mt-4 h-4 w-4 text-sky-500 transition-transform duration-300 group-hover:-translate-x-1" />
                  </Link>
                </>
              )}

              <Link
                href="/favorites"
                className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-rose-200 hover:shadow-xl"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 transition-all duration-300 group-hover:bg-rose-500 group-hover:text-white">
                  <Heart className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                </div>

                <h3 className="mt-5 font-black text-slate-900">
                  المفضلة
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  الأنشطة والأماكن المحفوظة
                </p>

                <ArrowLeft className="mt-4 h-4 w-4 text-rose-500 transition-transform duration-300 group-hover:-translate-x-1" />
              </Link>

              <Link
                href="/profile"
                className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-200 hover:shadow-xl"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 transition-all duration-300 group-hover:bg-emerald-500 group-hover:text-white">
                  <CheckCircle2 className="h-5 w-5" />
                </div>

                <h3 className="mt-5 font-black text-slate-900">
                  الملف الشخصي
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  إدارة معلومات حسابك
                </p>

                <ArrowLeft className="mt-4 h-4 w-4 text-emerald-500 transition-transform duration-300 group-hover:-translate-x-1" />
              </Link>
            </div>
          </section>

          {/* Owner insight */}
          {isOwner && (
            <section className="mt-8 pb-8">
              <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-sky-500 to-cyan-400" />

                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
                      <TrendingUp className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="font-black text-slate-900">
                        نصيحة لزيادة ظهور نشاطك
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        أضف صورًا واضحة، حدّث بيانات التواصل،
                        وأكمل الخدمات والموقع لزيادة ثقة العملاء.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/dashboard/businesses"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-50 px-4 py-2.5 text-xs font-black text-sky-600 transition hover:bg-sky-500 hover:text-white"
                  >
                    تحسين النشاط
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
