
import Link from "next/link";
import { ArrowLeft, Tags } from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import CategoryCard from "@/components/category/category-card";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
    },
    include: {
      _count: {
        select: {
          businesses: true,
          services: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden bg-sky-500">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-sky-700/20" />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-xl shadow-sky-900/20 backdrop-blur-sm">
                <Tags className="h-8 w-8" />
              </div>

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-sky-200" />
                دليل الخدمات والأعمال
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                اكتشف الخدمات والتصنيفات
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-sky-50 sm:text-lg">
                تصفح مختلف أنواع الخدمات والأعمال الموجودة في دليل واعثر بسهولة على ما تبحث عنه.
              </p>

              <div className="mt-8 flex justify-center">
                <div className="inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 shadow-lg shadow-sky-900/20 backdrop-blur-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Tags className="h-5 w-5" />
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-extrabold text-white">
                      {categories.length}
                    </p>

                    <p className="text-xs font-medium text-sky-100">
                      تصنيف متاح حاليًا
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-1 w-8 rounded-full bg-sky-500" />
                  <span className="text-sm font-bold text-sky-600">تصفح الدليل</span>
                </div>

                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                  جميع التصنيفات
                </h2>

                <p className="mt-2 text-sm leading-7 text-slate-500">
                  {categories.length} تصنيف متاح حاليًا
                </p>
              </div>

              <Link
                href="/"
                className="group hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600 sm:flex"
              >
                العودة للرئيسية
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              </Link>
            </div>

            {categories.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              <div className="relative overflow-hidden rounded-[2rem] border border-dashed border-sky-200 bg-sky-50/40 px-6 py-16 text-center">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent" />

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-sky-400 shadow-sm ring-1 ring-sky-100">
                  <Tags className="h-8 w-8" />
                </div>

                <h3 className="mt-5 text-xl font-extrabold text-slate-900">
                  لا توجد تصنيفات حاليًا
                </h3>

                <p className="mt-2 text-sm leading-7 text-slate-500">
                  سيتم إضافة التصنيفات قريبًا.
                </p>

                <Link
                  href="/"
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-200 transition-all hover:-translate-y-0.5 hover:bg-sky-600 hover:shadow-xl hover:shadow-sky-200"
                >
                  العودة للرئيسية
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
