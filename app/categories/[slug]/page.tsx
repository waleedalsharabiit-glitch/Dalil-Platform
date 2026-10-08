
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
import { getImageUrlWithVariant } from "@/lib/storage/business-image-storage";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function normalizeLookupSlug(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[\u200C\u200D\uFEFF]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default async function CategoryPage({
  params,
}: CategoryPageProps) {
  const { slug } = await params;
  const rawSlug = decodeURIComponent(slug).trim();
  const lookupSlugs = Array.from(
    new Set([
      rawSlug,
      rawSlug.toLowerCase(),
      normalizeLookupSlug(rawSlug),
      rawSlug.replace(/-/g, " "),
      rawSlug.replace(/\s+/g, "-"),
    ].filter(Boolean)),
  );

  const category = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: { in: lookupSlugs } },
        { slug: { equals: rawSlug, mode: "insensitive" } },
        { slug: { equals: normalizeLookupSlug(rawSlug), mode: "insensitive" } },
      ],
    },
    include: {
      parent: { select: { id: true, name: true, slug: true, image: true } },
      children: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true, description: true, image: true, icon: true },
      },
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
        imageUrl: getImageUrlWithVariant(business.images[0]?.url ?? null, "card"),
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
        <div className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm text-slate-500">
              <Link
                href="/"
                className="transition hover:text-sky-600"
              >
                الرئيسية
              </Link>

              <ChevronLeft className="h-4 w-4" />

              <Link
                href="/categories"
                className="transition hover:text-sky-600"
              >
                التصنيفات
              </Link>

              <ChevronLeft className="h-4 w-4" />

              <span className="font-medium text-slate-900">
                {category.name}
              </span>
            </nav>
          </div>
        </div>

        {/* Category Hero */}
        <section className="bg-gradient-to-b from-sky-50 to-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 sm:py-16">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="max-w-3xl">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                  <Tags className="h-7 w-7" />
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  {category.name}
                </h1>

                {category.description && (
                  <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">
                    {category.description}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
                    <Tags className="h-4 w-4 text-sky-500" />
                    {category.services.length} خدمة
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
                    <BriefcaseBusiness className="h-4 w-4 text-sky-500" />
                    {businesses.length} نشاط
                  </div>
                </div>

                {category.parent && (
                  <div className="mt-6">
                    <Link
                      href={`/categories/${category.parent.slug}`}
                      className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-50"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      التصنيف الرئيسي: {category.parent.name}
                    </Link>
                  </div>
                )}
              </div>

              {category.image && (
                <div className="relative h-64 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {category.children.length > 0 && (
          <section className="border-b bg-white py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-900">تصنيفات فرعية</h2>
                <Link href="/categories" className="text-sm font-bold text-sky-600 hover:text-sky-700">
                  كل التصنيفات
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                {category.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/categories/${child.slug}`}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Services */}
        <section className="py-12 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900">
                الخدمات المتاحة
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                الخدمات المرتبطة بتصنيف {category.name}
              </p>
            </div>

            {category.services.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {category.services.map((service) => (
                  <div
                    key={service.id}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition group-hover:bg-sky-100">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900">
                          {service.name}
                        </h3>

                        {service.description && (
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <Tags className="mx-auto h-8 w-8 text-slate-400" />

                <p className="mt-3 text-sm text-slate-500">
                  لا توجد خدمات مضافة لهذا التصنيف حاليًا.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Businesses */}
        <section className="border-t bg-slate-50 py-12 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-slate-900">
                الأنشطة في هذا التصنيف
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                اكتشف الأنشطة التجارية والخدمية المرتبطة بهذا التصنيف.
              </p>
            </div>

            {businesses.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {businesses.map((business) => (
                  <BusinessCard
                    key={business.id}
                    {...business}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
                  <MapPin className="h-7 w-7" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  لا توجد أنشطة مضافة بعد
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
                  لم تتم إضافة أنشطة تجارية نشطة لهذا التصنيف حتى الآن.
                  يمكنك العودة لاحقًا لاكتشاف الأماكن الجديدة.
                </p>

                <Link
                  href="/categories"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
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
