
import Link from "next/link";
import {
  ArrowRight,
  Store,
} from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

import BusinessCreateForm from "@/components/business/business-create-form";

export default async function CreateBusinessPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "BUSINESS_OWNER") {
    redirect("/dashboard");
  }

  const [categories, services] = await Promise.all([
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

    prisma.service.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        {
          category: {
            name: "asc",
          },
        },
        {
          name: "asc",
        },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        categoryId: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const formattedServices = services.map((service) => ({
    id: service.id,
    name: service.name,
    slug: service.slug,
    categoryId: service.categoryId,
    categoryName: service.category.name,
  }));

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f0f9ff] px-4 py-6 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 top-10 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />

        <div className="absolute -left-32 top-[40%] h-96 w-96 rounded-full bg-cyan-200/20 blur-3xl" />

        <div className="absolute right-[35%] bottom-[-120px] h-80 w-80 rounded-full bg-sky-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/dashboard"
            className="font-medium text-slate-400 transition hover:text-sky-600"
          >
            لوحة التحكم
          </Link>

          <ArrowRight className="h-4 w-4 text-slate-300" />

          <Link
            href="/dashboard/businesses"
            className="font-medium text-slate-400 transition hover:text-sky-600"
          >
            أنشطتي
          </Link>

          <ArrowRight className="h-4 w-4 text-slate-300" />

          <span className="font-bold text-slate-700">
            إنشاء نشاط
          </span>
        </div>

        {/* Hero */}
        <section className="relative mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-l from-sky-700 via-sky-600 to-cyan-500 p-6 text-white shadow-xl shadow-sky-200/50 sm:p-8">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />

          <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-cyan-300/20 blur-2xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm">
                <Store className="h-7 w-7" />
              </div>

              <div>
                <p className="text-sm font-bold text-sky-100">
                  إدارة الأنشطة
                </p>

                <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                  أضف نشاطك التجاري
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-7 text-sky-50">
                  أضف نشاطك إلى دليل ليتمكن المستخدمون من
                  العثور عليك واكتشاف خدماتك والتواصل معك.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/businesses"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <ArrowRight className="h-4 w-4" />
              العودة لأنشطتي
            </Link>
          </div>
        </section>

        {/* Form */}
        <section>
          <BusinessCreateForm
            categories={categories}
            services={formattedServices}
          />
        </section>
      </div>
    </main>
  );
}
