
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  MapPin,
  Search,
  Star,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import CategoryCard from "@/components/category/category-card";
import BusinessCard from "@/components/business/business-card";
import SearchBox from "@/components/search/search-box";
import { getImageUrlWithVariant } from "@/lib/storage/business-image-storage";

export default async function HomePage() {
  const [categories, businesses] = await Promise.all([
    prisma.category.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
      take: 4,
    }),

    prisma.business.findMany({
      where: {
        status: "ACTIVE",
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
      },
      orderBy: [
        {
          isVerified: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 6,
    }),
  ]);

  const businessCards = businesses.map((business) => {
    const ratings = business.reviews.map(
      (review) => review.rating,
    );

    const rating =
      ratings.length > 0
        ? ratings.reduce((sum, value) => sum + value, 0) /
          ratings.length
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
      reviewsCount: ratings.length,
      isVerified: business.isVerified,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-sky-500">
          {/* Decorative shapes */}
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-sky-700/20" />

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
                <MapPin size={14} />
                اكتشف الخدمات والأماكن من حولك
              </div>

              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                ابحث عن كل ما تحتاجه
                <br />
                <span className="text-sky-100">
                  في مكان واحد
                </span>
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-sky-50 sm:text-base">
                دليل يساعدك على العثور على أفضل المحلات والخدمات
                والأماكن المحلية، ومعرفة تقييماتها ومواقعها والتواصل
                معها بسهولة.
              </p>

              {/* Search */}
              <div className="mt-9">
                <SearchBox />
              </div>

              {/* Popular searches */}
              <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
                <span className="ml-1 text-xs font-medium text-sky-100">
                  الأكثر بحثًا:
                </span>

                {[
                  "صيانة لابتوبات",
                  "مطاعم",
                  "صيدليات",
                  "شبكات",
                  "هواتف",
                ].map((item) => (
                  <Link
                    key={item}
                    href={`/search?q=${encodeURIComponent(item)}`}
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-white/20"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="mb-1 text-sm font-semibold text-sky-600">
                استكشف
              </p>

              <h2 className="text-2xl font-bold text-slate-900">
                تصفح حسب التصنيف
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                اختر نوع الخدمة التي تبحث عنها
              </p>
            </div>

            <Link
              href="/categories"
              className="hidden items-center gap-1.5 text-sm font-bold text-sky-600 transition hover:text-sky-700 sm:flex"
            >
              عرض الكل
              <ArrowLeft size={16} />
            </Link>
          </div>

          {categories.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  name={category.name}
                  slug={category.slug}
                  icon={category.icon}
                  image={category.image}
                  description={category.description}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              لا توجد تصنيفات متاحة حاليًا.
            </div>
          )}

          <Link
            href="/categories"
            className="mt-5 flex items-center justify-center gap-1.5 text-sm font-bold text-sky-600 sm:hidden"
          >
            عرض جميع التصنيفات
            <ArrowLeft size={16} />
          </Link>
        </section>

        {/* Featured Businesses */}
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-sm font-semibold text-sky-600">
                  اكتشف
                </p>

                <h2 className="text-2xl font-bold text-slate-900">
                  أماكن مميزة
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  أنشطة وخدمات يمكنك اكتشافها
                </p>
              </div>

              <Link
                href="/businesses"
                className="hidden items-center gap-1.5 text-sm font-bold text-sky-600 transition hover:text-sky-700 sm:flex"
              >
                عرض الكل
                <ArrowLeft size={16} />
              </Link>
            </div>

            {businessCards.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {businessCards.map((business) => (
                  <BusinessCard
                    key={business.id}
                    {...business}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
                  <Search size={24} />
                </div>

                <h3 className="mt-4 font-bold text-slate-800">
                  لا توجد أماكن مضافة بعد
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  ستظهر الأنشطة هنا بمجرد إضافتها وتفعيلها.
                </p>
              </div>
            )}

            <div className="mt-6 text-center sm:hidden">
              <Link
                href="/businesses"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-sky-600"
              >
                عرض جميع الأماكن
                <ArrowLeft size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* Why Dalil */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-sky-600">
              لماذا دليل؟
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              كل ما تحتاجه لاتخاذ قرار أفضل
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              نجمع لك المعلومات التي تحتاجها حتى تجد الخدمة المناسبة
              بأقل وقت وجهد.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Search size={22} />}
              title="ابحث بسهولة"
              description="ابحث عن أي خدمة أو نشاط باستخدام كلمات بسيطة."
            />

            <FeatureCard
              icon={<MapPin size={22} />}
              title="اكتشف القريب منك"
              description="اعرف الأماكن والخدمات الموجودة في منطقتك."
            />

            <FeatureCard
              icon={<Star size={22} />}
              title="قارن التقييمات"
              description="اطلع على تقييمات وآراء المستخدمين قبل الاختيار."
            />

            <FeatureCard
              icon={<BadgeCheck size={22} />}
              title="أماكن موثوقة"
              description="تميّز الأنشطة الموثقة بسهولة من خلال علامة التوثيق."
            />
          </div>
        </section>

        {/* Business CTA */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-12 text-center sm:px-12">
            <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-sky-500/10" />
            <div className="absolute -bottom-24 -right-16 h-56 w-56 rounded-full bg-sky-500/10" />

            <div className="relative">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/20">
                <Users size={25} />
              </div>

              <h2 className="mt-5 text-2xl font-bold text-white">
                هل لديك نشاط تجاري؟
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-300">
                أضف نشاطك إلى دليل واجعل عملاء جدد يكتشفون خدماتك
                ويتواصلون معك بسهولة.
              </p>

              <Link
                href="/business/create"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400"
              >
                أضف نشاطك الآن
                <ArrowLeft size={17} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
        {icon}
      </div>

      <h3 className="mt-4 font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}
