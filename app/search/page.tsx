import Link from "next/link";
import { ArrowRight, Search, Sparkles } from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { searchBusinesses } from "@/lib/search/search-businesses";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import BusinessCard from "@/components/business/business-card";
import SearchBox from "@/components/search/search-box";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const { q = "", category = "" } = await searchParams;
  const query = q.trim().slice(0, 300);
  const categorySlug = category.trim();
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, image: true },
  });
  const result =
    query.length >= 2 ? await searchBusinesses(query, categorySlug || undefined) : null;

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <SiteHeader />
      <main>
        <section className="border-b border-sky-100 bg-gradient-to-b from-sky-50 to-white">
          <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
            <Link href="/businesses" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700">
              <ArrowRight className="h-4 w-4" />
              تصفح الأنشطة
            </Link>
            <h1 className="mt-4 flex items-center gap-3 text-2xl font-black text-slate-900">
              <Search className="text-sky-600" />
              البحث الذكي
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              اكتب ما تحتاجه بطريقتك، مثل: سباك طوارئ في جدة.
            </p>
            <div className="mt-6">
              <SearchBox defaultQuery={query} />
            </div>
            {categories.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {categories.map((item) => {
                  const isActive = item.slug === categorySlug;
                  return (
                    <Link
                      key={item.id}
                      href={
                        query
                          ? `/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(item.slug)}`
                          : `/search?category=${encodeURIComponent(item.slug)}`
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                        isActive
                          ? "border-sky-200 bg-sky-50 text-sky-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-600"
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {result ? (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <p className="font-bold text-slate-800">
                  {result.businesses.length} نتيجة لعبارة «{query}»
                  {categorySlug ? ` في تصنيف ${categorySlug}` : ""}
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  {result.aiPowered ? "تم تحليل الطلب بالذكاء الاصطناعي" : "بحث نصي مباشر"}
                </span>
              </div>
              {result.businesses.length ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {result.businesses.map((business) => (
                    <BusinessCard key={business.id} {...business} />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center">
                  <Search className="mx-auto h-9 w-9 text-slate-300" />
                  <h2 className="mt-4 font-bold text-slate-800">لم نعثر على نتائج</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    جرّب كلمات مختلفة أو ابحث باسم الخدمة أو المدينة.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center">
              <Search className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-4 text-sm text-slate-500">
                ابدأ بكتابة وصف للخدمة التي تبحث عنها.
              </p>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
