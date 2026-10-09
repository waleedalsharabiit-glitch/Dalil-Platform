
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  MapPin,
  Tags,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import BusinessCard from "@/components/business/business-card";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoryPage({
  params,
}: CategoryPageProps) {
  const { slug } = await params;

  const rawSlug = slug.trim();
  const decodedSlug = (() => {
    try {
      return decodeURIComponent(rawSlug).trim();
    } catch {
      return rawSlug;
    }
  })();

  const category = await prisma.category.findFirst({
    where: {
      OR: [{ slug: decodedSlug }, { slug: rawSlug }],
    },
    include: {
      services: {
        where: {
          isActive: true,
        },
        orderBy: {
          name: "asc",
        },
      },
      businesses: {
        where: {
          business: {
            status: "ACTIVE",
          },
        },
        include: {
          business: {
            include: {
              images: {
                where: {
                  isPrimary: true,
                },
                take: 1,
              },
              locations: {
                take: 1,
              },
              reviews: {
                where: {
                  isPublished: true,
                },
                select: {
                  rating: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!category || !category.isActive) {
    notFound();
  }

  const businesses = category.businesses
    .map((item) => item.business)
    .filter(Boolean)
    .map((business) => {
      const reviews = business.reviews;

      const rating =
        reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviews.length
          : 0;

      const location = business.locations[0];

      return {
        id: business.id,
        name: business.name,
        slug: business.slug,
        description: business.description,
        imageUrl: business.images[0]?.url ?? null,
        city: location?.city ?? null,
        district: location?.district ?? null,
        rating,
        reviewsCount: reviews.length,
        isVerified: business.isVerified,
      };
    });

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main>
        {/* Breadcrumb */}
        <div className="border-b border-slate-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href="/"
                className="font-medium text-slate-400 transition-colors hover:text-sky-600"
              >
                الرئيسية
              </Link>

              <ChevronLeft className="h-4 w-4 text-slate-300" />

              <Link
                href="/categories"
                className="font-medium text-slate-400 transition-colors hover:text-sky-600"
              >
                التصنيفات
              </Link>

              <ChevronLeft className="h-4 w-4 text-slate-300" />

              <span className="font-semibold text-slate-800">
                {category.name}
              </span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden border-b border-sky-100 bg-gradient-to-br from-sky-50 via-white to-sky-100/60">
          {/* Decorative shapes */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-sky-100/60 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
              <div className="max-w-3xl">
                {/* Icon */}
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-lg shadow-sky-100 ring-1 ring-sky-100">
                  <Tags className="h-8 w-8" />
                </div>

                <div>
                  <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
                    تصنيف الخدمات
                  </span>

                  <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                    {category.name}
                  </h1>

                  {category.description && (
                    <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                      {category.description}
                    </p>
                  )}

                  {category.image && (
                    <div className="mt-8 overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-xl shadow-sky-100/80 ring-1 ring-sky-100">
                      <div
                        className="relative h-64 w-full bg-slate-200 sm:h-80"
                        style={{
                          backgroundImage: `linear-gradient(135deg, rgba(14,165,233,0.45), rgba(15,23,42,0.52)), url(${category.image})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/10 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-5 sm:p-7">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-100">
                              تصنيف مميز
                            </p>
                            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                              {category.name}
                            </h2>
                          </div>

                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/40 bg-white/15 text-white backdrop-blur-sm">
                            <Tags className="h-6 w-6" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-8 flex flex-wrap gap-3">
                  <div className="flex min-w-[150px] items-center gap-3 rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                      <Tags className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-lg font-extrabold text-slate-900">
                        {category.services.length}
                      </p>
                      <p className="text-xs font-medium text-slate-500">
                        خدمة متاحة
                      </p>
                    </div>
                  </div>

                  <div className="flex min-w-[150px] items-center gap-3 rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                      <BriefcaseBusiness className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-lg font-extrabold text-slate-900">
                        {businesses.length}
                      </p>
                      <p className="text-xs font-medium text-slate-500">
                        نشاط متاح
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero visual */}
              <div className="hidden lg:flex">
                <div className="relative flex h-56 w-56 items-center justify-center rounded-[2.5rem] border border-white bg-white/80 shadow-2xl shadow-sky-100 backdrop-blur">
                  <div className="absolute inset-5 rounded-[2rem] border border-sky-100 bg-gradient-to-br from-sky-50 to-white" />

                  <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-sky-500 text-white shadow-xl shadow-sky-200">
                    <Tags className="h-11 w-11" />
                  </div>

                  <div className="absolute -right-4 top-8 flex h-11 w-11 items-center justify-center rounded-xl border border-sky-100 bg-white text-sky-500 shadow-lg">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>

                  <div className="absolute -bottom-4 -left-4 flex h-11 w-11 items-center justify-center rounded-xl border border-sky-100 bg-white text-sky-500 shadow-lg">
                    <BriefcaseBusiness className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-1 w-8 rounded-full bg-sky-500" />
                  <span className="text-sm font-bold text-sky-600">
                    الخدمات
                  </span>
                </div>

                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                  الخدمات المتاحة
                </h2>

                <p className="mt-2 text-sm leading-7 text-slate-500">
                  الخدمات المرتبطة بتصنيف {category.name}
                </p>
              </div>

              <div className="hidden rounded-full bg-sky-50 px-4 py-2 text-xs font-bold text-sky-700 sm:block">
                {category.services.length} خدمة
              </div>
            </div>

            {category.services.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.services.map((service) => (
                  <div
                    key={service.id}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-100/60"
                  >
                    {/* Hover decoration */}
                    <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-sky-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <div className="relative flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 transition-all duration-300 group-hover:bg-sky-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-sky-200">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 transition-colors group-hover:text-sky-700">
                          {service.name}
                        </h3>

                        {service.description && (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                            {service.description}
                          </p>
                        )}
                      </div>

                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:-translate-x-1 group-hover:text-sky-500" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-sky-200 bg-sky-50/40 px-6 py-14 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-sky-400 shadow-sm ring-1 ring-sky-100">
                  <Tags className="h-7 w-7" />
                </div>

                <p className="mt-4 text-sm font-medium text-slate-500">
                  لا توجد خدمات مضافة لهذا التصنيف حاليًا.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Businesses */}
        <section className="relative overflow-hidden border-t border-sky-100 bg-gradient-to-b from-sky-50/70 to-white py-14 sm:py-20">
          <div className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-sky-100/50 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-1 w-8 rounded-full bg-sky-500" />
                  <span className="text-sm font-bold text-sky-600">
                    دليل الأنشطة
                  </span>
                </div>

                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                  الأنشطة في هذا التصنيف
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                  اكتشف الأنشطة التجارية والخدمية المرتبطة بهذا التصنيف.
                </p>
              </div>

              {businesses.length > 0 && (
                <div className="flex items-center gap-2 self-start rounded-full border border-sky-100 bg-white px-4 py-2 text-xs font-bold text-sky-700 shadow-sm sm:self-auto">
                  <BriefcaseBusiness className="h-4 w-4" />
                  {businesses.length} نشاط
                </div>
              )}
            </div>

            {businesses.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {businesses.map((business) => (
                  <BusinessCard
                    key={business.id}
                    {...business}
                  />
                ))}
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-[2rem] border border-sky-100 bg-white px-6 py-16 text-center shadow-sm">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent" />

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-500 ring-1 ring-sky-100">
                  <MapPin className="h-7 w-7" />
                </div>

                <h3 className="mt-5 text-xl font-extrabold text-slate-900">
                  لا توجد أنشطة مضافة بعد
                </h3>

                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
                  لم تتم إضافة أنشطة تجارية نشطة لهذا التصنيف حتى الآن.
                  يمكنك العودة لاحقًا لاكتشاف الأماكن الجديدة.
                </p>

                <Link
                  href="/categories"
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-200 transition-all hover:-translate-y-0.5 hover:bg-sky-600 hover:shadow-xl hover:shadow-sky-200"
                >
                  تصفح التصنيفات
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
