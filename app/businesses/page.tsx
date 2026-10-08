
import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Filter,
  Search,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import BusinessCard from "@/components/business/business-card";
import BusinessSort from "@/components/business/business-sort";
import { getImageUrlWithVariant } from "@/lib/storage/business-image-storage";
interface BusinessesPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    city?: string;
    sort?: string;
  }>;
}

export default async function BusinessesPage({
  searchParams,
}: BusinessesPageProps) {
  const params = await searchParams;

  const q = params.q?.trim() ?? "";
  const categorySlug = params.category?.trim() ?? "";
  const city = params.city?.trim() ?? "";
  const sort = params.sort ?? "newest";

  const [categories, cities] = await Promise.all([
    prisma.category.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),

    prisma.location.findMany({
      distinct: ["city"],
      where: {
        city: {
          not: null,
        },
        business: {
          status: "ACTIVE",
        },
      },
      orderBy: {
        city: "asc",
      },
      select: {
        city: true,
      },
    }),
  ]);

  const category = categorySlug
    ? await prisma.category.findUnique({
        where: {
          slug: categorySlug,
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      })
    : null;

  const businesses = await prisma.business.findMany({
    where: {
      status: "ACTIVE",

      ...(q
        ? {
            OR: [
              {
                name: {
                  contains: q,
                  mode: "insensitive",
                },
              },
              {
                description: {
                  contains: q,
                  mode: "insensitive",
                },
              },
              {
                services: {
                  some: {
                    service: {
                      name: {
                        contains: q,
                        mode: "insensitive",
                      },
                    },
                  },
                },
              },
            ],
          }
        : {}),

      ...(category
        ? {
            categories: {
              some: {
                categoryId: category.id,
              },
            },
          }
        : {}),

      ...(city
        ? {
            locations: {
              some: {
                city: {
                  equals: city,
                  mode: "insensitive",
                },
              },
            },
          }
        : {}),
    },

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

      categories: {
        include: {
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
        take: 3,
      },
    },

    orderBy:
      sort === "name"
        ? {
            name: "asc",
          }
        : sort === "verified"
          ? {
              isVerified: "desc",
            }
          : {
              createdAt: "desc",
            },
  });

  const formattedBusinesses = businesses.map((business) => {
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
        {/* Hero */}
        <section className="border-b bg-gradient-to-b from-sky-50 to-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 sm:py-16">
            <div className="max-w-3xl">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                <BriefcaseBusiness className="h-7 w-7" />
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                اكتشف الأنشطة والخدمات
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                ابحث عن أفضل الأنشطة والخدمات القريبة منك، وقارن بينها
                واكتشف تفاصيلها وتقييمات المستخدمين.
              </p>
            </div>
          </div>
        </section>

        {/* Search & Filters */}
        <section className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <form
              method="GET"
              className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_180px_auto]"
            >
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="ابحث عن نشاط أو خدمة..."
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pr-12 pl-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                />
              </div>

              {/* Category */}
              <select
                name="category"
                defaultValue={categorySlug}
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              >
                <option value="">كل التصنيفات</option>

                {categories.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>

              {/* City */}
              <select
                name="city"
                defaultValue={city}
                className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              >
                <option value="">كل المدن</option>

                {cities.map((item) =>
                  item.city ? (
                    <option key={item.city} value={item.city}>
                      {item.city}
                    </option>
                  ) : null,
                )}
              </select>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 text-sm font-semibold text-white transition hover:bg-sky-600"
              >
                <Filter className="h-4 w-4" />
                تطبيق
              </button>
            </form>
          </div>
        </section>

        {/* Results */}
        <section className="bg-slate-50 py-10 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Results Header */}
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {q
                    ? `نتائج البحث عن "${q}"`
                    : category
                      ? `أنشطة ${category.name}`
                      : "جميع الأنشطة"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {formattedBusinesses.length} نتيجة
                </p>
              </div>

            <BusinessSort value={sort} />
            </div>

            {/* Business Grid */}
            {formattedBusinesses.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {formattedBusinesses.map((business) => (
                  <BusinessCard key={business.id} {...business} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
                  <BriefcaseBusiness className="h-8 w-8" />
                </div>

                <h3 className="mt-5 text-xl font-bold text-slate-900">
                  لا توجد نتائج حاليًا
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
                  لم نعثر على أنشطة تطابق معايير البحث الحالية.
                  جرّب تغيير كلمات البحث أو الفلاتر.
                </p>

                <Link
                  href="/businesses"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                >
                  عرض جميع الأنشطة
                  <ArrowLeft className="h-4 w-4" />
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
