
import Link from "next/link";
import { ArrowRight, Building2, Pencil } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

import BusinessEditForm from "@/components/business/business-edit-form";

interface BusinessEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BusinessEditPage({
  params,
}: BusinessEditPageProps) {
  const { id } = await params;

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "BUSINESS_OWNER") {
    redirect("/dashboard");
  }

  const business = await prisma.business.findFirst({
    where: {
      id,
      ownerId: session.user.id,
    },
    include: {
      categories: {
        select: {
          categoryId: true,
        },
      },
      services: {
        select: {
          serviceId: true,
        },
      },
      locations: {
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
      },
    },
  });

  if (!business) {
    notFound();
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
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  const location = business.locations[0];

  const initialData = {
    id: business.id,
    name: business.name,
    description: business.description ?? "",
    phone: business.phone ?? "",
    whatsapp: business.whatsapp ?? "",
    website: business.website ?? "",

    categoryIds: business.categories.map(
      (item) => item.categoryId,
    ),

    serviceIds: business.services.map(
      (item) => item.serviceId,
    ),

    location: location
      ? {
          address: location.address ?? "",
          city: location.city ?? "",
          district: location.district ?? "",
          latitude:
            location.latitude != null
              ? Number(location.latitude)
              : null,
          longitude:
            location.longitude != null
              ? Number(location.longitude)
              : null,
        }
      : {
          address: "",
          city: "",
          district: "",
          latitude: null,
          longitude: null,
        },
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f0f9ff] px-4 py-6 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 top-10 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute -left-32 top-[45%] h-96 w-96 rounded-full bg-cyan-200/20 blur-3xl" />
        <div className="absolute right-[40%] bottom-[-120px] h-80 w-80 rounded-full bg-sky-100/40 blur-3xl" />
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

          <Link
            href={`/dashboard/businesses/${business.id}`}
            className="max-w-[180px] truncate font-medium text-slate-400 transition hover:text-sky-600"
          >
            {business.name}
          </Link>

          <ArrowRight className="h-4 w-4 text-slate-300" />

          <span className="font-bold text-slate-700">
            تعديل النشاط
          </span>
        </div>

        {/* Page heading */}
        <section className="mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-l from-sky-700 via-sky-600 to-cyan-500 p-6 text-white shadow-xl shadow-sky-200/50 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <Pencil className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-bold text-sky-100">
                  إدارة نشاطك
                </p>

                <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                  تعديل النشاط
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-7 text-sky-50">
                  حدّث معلومات نشاطك وخدماتك وموقعك حتى يحصل العملاء
                  على معلومات دقيقة وواضحة.
                </p>
              </div>
            </div>

            <Link
              href={`/dashboard/businesses/${business.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <Building2 className="h-4 w-4" />
              العودة للنشاط
            </Link>
          </div>
        </section>

        <BusinessEditForm
          business={initialData}
          categories={categories}
          services={services}
        />
      </div>
    </main>
  );
}
