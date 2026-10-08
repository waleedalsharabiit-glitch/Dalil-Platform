import Link from "next/link";
import { Heart } from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import BusinessCard from "@/components/business/business-card";

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id, business: { status: "ACTIVE" } },
    include: {
      business: {
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          locations: { take: 1 },
          categories: {
            include: {
              category: true,
            },
            take: 3,
          },
          reviews: {
            where: { isPublished: true },
            select: { rating: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
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
      label: "عدد الأنشطة",
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
      label: "تصنيفات مفضلة",
      value: uniqueCategories.size,
      accent: "text-rose-600",
      badge: "bg-rose-50",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <Heart className="fill-current" />
          </span>

          <div>
            <h1 className="text-2xl font-black text-slate-900">
              المفضلة
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              الأنشطة التي حفظتها للرجوع إليها بسرعة.
            </p>
          </div>
        </div>

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

        {favorites.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map(({ business }) => {
              const ratings = business.reviews.map(
                (review) => review.rating,
              );
              const rating = ratings.length
                ? ratings.reduce((sum, value) => sum + value, 0) /
                  ratings.length
                : 0;
              const location = business.locations[0];

              return (
                <BusinessCard
                  key={business.id}
                  id={business.id}
                  name={business.name}
                  slug={business.slug}
                  description={business.description}
                  imageUrl={business.images[0]?.url}
                  city={location?.city}
                  district={location?.district}
                  rating={rating}
                  reviewsCount={ratings.length}
                  isVerified={business.isVerified}
                />
              );
            })}
          </div>
        ) : (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Heart className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-4 text-lg font-bold text-slate-800">
              قائمة المفضلة فارغة
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              احفظ الأنشطة التي تهمك لتجدها هنا بسهولة في كل مرة.
            </p>
            <Link
              href="/businesses"
              className="mt-5 inline-flex rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-700"
            >
              اكتشف الأنشطة
            </Link>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
