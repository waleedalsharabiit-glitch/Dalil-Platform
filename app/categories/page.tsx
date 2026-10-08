
import Link from "next/link";
import { ArrowLeft, Tags } from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { buildCategoryTree } from "@/lib/categories/category-navigation";
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

  const categoryTree = buildCategoryTree(categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon,
    image: category.image,
    parentId: category.parentId,
    isActive: category.isActive,
  })));

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="border-b bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                <Tags className="h-7 w-7" />
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                اكتشف الخدمات والتصنيفات
              </h1>

              <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">
                تصفح مختلف أنواع الخدمات والأعمال الموجودة في دليل
                واعثر بسهولة على ما تبحث عنه.
              </p>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  جميع التصنيفات
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {categories.length} تصنيف متاح حاليًا
                </p>
              </div>

              <Link
                href="/"
                className="hidden items-center gap-2 text-sm font-semibold text-sky-600 transition hover:text-sky-700 sm:flex"
              >
                العودة للرئيسية
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>

            {categoryTree.length > 0 ? (
              <div className="space-y-8">
                {categoryTree.map((category) => (
                  <div key={category.id} className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-sky-600">التصنيف الرئيسي</span>
                        <h3 className="text-xl font-black text-slate-900">{category.name}</h3>
                      </div>
                      <Link
                        href={`/categories/${category.slug}`}
                        className="text-sm font-bold text-sky-600 hover:text-sky-700"
                      >
                        عرض التفاصيل
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      <div className="col-span-full sm:col-span-1">
                        <CategoryCard
                          name={category.name}
                          slug={category.slug}
                          icon={category.icon}
                          image={category.image}
                          description={category.description}
                        />
                      </div>

                      {category.children.length > 0 &&
                        category.children.map((child) => (
                          <CategoryCard
                            key={child.id}
                            name={child.name}
                            slug={child.slug}
                            icon={child.icon}
                            image={child.image}
                            description={child.description}
                          />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
                <Tags className="mx-auto h-10 w-10 text-slate-400" />

                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  لا توجد تصنيفات حاليًا
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  سيتم إضافة التصنيفات قريبًا.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
