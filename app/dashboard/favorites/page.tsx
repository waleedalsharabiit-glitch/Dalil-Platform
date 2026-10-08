
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Heart,
  MapPin,
  Star,
} from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export default async function FavoritesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const favorites = await prisma.favorite.findMany({
    where: {
      userId: session.user.id,
      business: {
        status: "ACTIVE",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      business: {
        include: {
          images: {
            orderBy: {
              sortOrder: "asc",
            },
            take: 1,
          },
          locations: {
            take: 1,
          },
          categories: {
            include: {
              category: true,
            },
            take: 2,
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
  });

  const uniqueCities = new Set(
    favorites
      .map(({ business }) => business.locations[0]?.city)
      .filter(Boolean) as string[],
  );

  const uniqueCategories = new Set(
    favorites.flatMap(({ business }) =>
      business.categories.map(({ category }) => category.name),
    ),
  );

  const stats = [
    {
      label: "أنشطة محجوزة",
      value: favorites.length,
      accent: "text-sky-600",
      badge: "bg-sky-50",
    },
    {
      label: "مدن مختلفة",
      value: uniqueCities.size,
      accent: "text-emerald-600",
      badge: "bg-emerald-50",
    },
    {
      label: "تصنيفات محبوبة",
      value: uniqueCategories.size,
      accent: "text-rose-600",
      badge: "bg-rose-50",
    },
  ];

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f0f9ff] px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-7">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <Heart className="h-6 w-6 fill-current" />
          </div>

          <p className="mt-5 text-xs font-black tracking-[0.2em] text-sky-600">
            FAVORITES
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900">
            المفضلة
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            الأنشطة التي حفظتها للوصول إليها بسرعة.
          </p>
        </header>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div
                className={`mb-3 inline-flex rounded-2xl p-2 ${stat.badge} ${stat.accent}`}
              >
                <Heart className="h-4 w-4 fill-current" />
              </div>

              <p className="text-2xl font-black text-slate-900">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {stat.label}
              </p>
            </div>
          ))}
        </section>

        {favorites.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-rose-50 text-rose-500">
              <Heart className="h-8 w-8" />
            </div>

            <h2 className="mt-6 text-xl font-black text-slate-900">
              المفضلة فارغة
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
              عندما تجد نشاطًا يعجبك، أضفه إلى المفضلة وستجده هنا.
            </p>

            <Link
              href="/businesses"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-sky-200 transition hover:bg-sky-600"
            >
              استكشف الأنشطة
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {favorites.map(({ business }) => {
              const ratingCount = business.reviews.length;

              const rating =
                ratingCount > 0
                  ? business.reviews.reduce(
                      (sum, review) =>
                        sum + review.rating,
                      0,
                    ) / ratingCount
                  : 0;

              const image = business.images[0]?.url;
              const location = business.locations[0];

              return (
                <Link
                  key={business.id}
                  href={`/businesses/${business.slug}`}
                  className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-100"
                >
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-sky-100 via-cyan-50 to-slate-100">
                    {image ? (
                      <img
                        src={image}
                        alt={business.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sky-300">
                        <Building2 className="h-14 w-14" />
                      </div>
                    )}

                    <div className="absolute inset-x-4 top-4 flex items-center justify-between">
                      <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-sky-700 shadow-sm backdrop-blur">
                        محفوظ
                      </span>

                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-sm backdrop-blur">
                        <Heart className="h-4 w-4 fill-current" />
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h2 className="font-black text-slate-900 group-hover:text-sky-600">
                      {business.name}
                    </h2>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {business.categories.map(({ category }) => (
                        <span
                          key={category.id}
                          className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-600"
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <MapPin className="h-4 w-4 text-sky-500" />
                        {[
                          location?.district,
                          location?.city,
                        ]
                          .filter(Boolean)
                          .join("، ") || "الموقع غير محدد"}
                      </span>

                      <span className="flex items-center gap-1 text-xs font-black text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        {rating > 0 ? rating.toFixed(1) : "جديد"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
