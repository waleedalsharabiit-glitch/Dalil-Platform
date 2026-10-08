import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";

import AdminServicesManager from "../../../components/admin/admin-services-manager";

export default async function AdminServicesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "SUPER_ADMIN"
  ) {
    redirect("/dashboard");
  }

  const [services, categories] = await Promise.all([
    prisma.service.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            businesses: true,
            requests: true,
          },
        },
      },
    }),

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
        isActive: true,
      },
    }),
  ]);

  const total = services.length;
  const active = services.filter((service) => service.isActive).length;
  const inactive = total - active;
  const used = services.filter(
    (service) => service._count.businesses > 0,
  ).length;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-500 p-7 text-white shadow-xl shadow-sky-200 md:p-10">
          <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-white/10" />

          <div className="relative">
            <p className="mb-2 text-sm font-medium text-sky-100">
              إدارة المحتوى
            </p>

            <h1 className="text-3xl font-black md:text-4xl">
              إدارة الخدمات
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-sky-50 md:text-base">
              أنشئ الخدمات واربطها بالتصنيفات المناسبة،
              ثم تحكم في ظهورها داخل منصة دليل.
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="إجمالي الخدمات"
            value={total}
            icon="🧩"
          />

          <StatCard
            title="الخدمات النشطة"
            value={active}
            icon="✓"
          />

          <StatCard
            title="الخدمات المعطلة"
            value={inactive}
            icon="⏸"
          />

          <StatCard
            title="خدمات مستخدمة"
            value={used}
            icon="🏢"
          />
        </section>

        <AdminServicesManager
          initialServices={services}
          categories={categories}
        />
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-100">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-2xl">{icon}</span>

        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600">
          دليل
        </span>
      </div>

      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}