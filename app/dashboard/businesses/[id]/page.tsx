
import Link from "next/link";
import Image from "next/image";

import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Clock3,
  ExternalLink,
  Globe,
  Heart,
  MapPin,
  Megaphone,
  MessageCircle,
  Pencil,
  Phone,
  Sparkles,
  Star,
  Wrench,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

import DashboardStatusBadge from "@/components/dashboard/dashboard-status-badge";

interface BusinessManagementPageProps {
  params: Promise<{
    id: string;
  }>;
}

const dayLabels: Record<string, string> = {
  SATURDAY: "السبت",
  SUNDAY: "الأحد",
  MONDAY: "الاثنين",
  TUESDAY: "الثلاثاء",
  WEDNESDAY: "الأربعاء",
  THURSDAY: "الخميس",
  FRIDAY: "الجمعة",
};

export default async function BusinessManagementPage({
  params,
}: BusinessManagementPageProps) {
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
        include: {
          category: true,
        },
      },
      services: {
        include: {
          service: {
            include: {
              category: true,
            },
          },
        },
      },
      locations: {
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
      },
      images: {
        orderBy: {
          sortOrder: "asc",
        },
        take: 6,
      },
      hours: {
        orderBy: {
          dayOfWeek: "asc",
        },
      },
      _count: {
        select: {
          reviews: {
            where: {
              isPublished: true,
            },
          },
          favorites: true,
          requests: true,
          offers: true,
        },
      },
    },
  });

  if (!business) {
    notFound();
  }

  const [
    requestsCount,
    pendingRequests,
    completedRequests,
    reviewsCount,
    favoritesCount,
    offersCount,
  ] = await Promise.all([
    prisma.serviceRequest.count({
      where: {
        businessId: business.id,
      },
    }),
    prisma.serviceRequest.count({
      where: {
        businessId: business.id,
        status: "PENDING",
      },
    }),
    prisma.serviceRequest.count({
      where: {
        businessId: business.id,
        status: "COMPLETED",
      },
    }),
    prisma.review.count({
      where: {
        businessId: business.id,
        isPublished: true,
      },
    }),
    prisma.favorite.count({
      where: {
        businessId: business.id,
      },
    }),
    prisma.offer.count({
      where: {
        businessId: business.id,
        status: "ACTIVE",
      },
    }),
  ]);

  const location = business.locations[0];

  const primaryImage =
    business.images.find((image) => image.isPrimary) ??
    business.images[0];

  const mapUrl =
    location?.latitude != null &&
    location?.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`
      : null;

  const hasContactInfo =
    Boolean(business.phone) ||
    Boolean(business.whatsapp) ||
    Boolean(business.website);

  const hasHours = business.hours.length > 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f0f9ff] px-4 py-6 sm:px-6 lg:px-8">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 top-20 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute -left-32 top-[40%] h-96 w-96 rounded-full bg-cyan-200/20 blur-3xl" />
        <div className="absolute right-[35%] top-[60%] h-64 w-64 rounded-full bg-sky-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/dashboard"
            className="font-medium text-slate-400 transition-colors hover:text-sky-600"
          >
            لوحة التحكم
          </Link>

          <ArrowRight className="h-4 w-4 text-slate-300" />

          <Link
            href="/dashboard/businesses"
            className="font-medium text-slate-400 transition-colors hover:text-sky-600"
          >
            أنشطتي
          </Link>

          <ArrowRight className="h-4 w-4 text-slate-300" />

          <span className="max-w-[220px] truncate font-bold text-slate-700">
            {business.name}
          </span>
        </div>

        {/* Hero */}
        <section className="group relative overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_20px_60px_-30px_rgba(14,165,233,0.35)]">
          {/* Cover */}
          <div className="relative h-56 overflow-hidden sm:h-64 lg:h-72">
            {primaryImage ? (
              <>
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.altText || business.name}
                  fill
                  unoptimized
                  sizes="100vw"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/20 to-sky-500/20" />
              </>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-l from-sky-700 via-sky-500 to-cyan-400">
                <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -right-20 bottom-[-100px] h-80 w-80 rounded-full bg-cyan-200/20 blur-3xl" />
              </div>
            )}

            <div className="absolute right-5 top-5 sm:right-7 sm:top-7">
              <div className="rounded-full border border-white/20 bg-slate-950/20 px-4 py-2 text-xs font-bold text-white backdrop-blur-md">
                إدارة النشاط
              </div>
            </div>
          </div>

          {/* Hero content */}
          <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-14 flex flex-col gap-6 lg:-mt-16 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-end">
                {/* Logo */}
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-[1.75rem] border-[5px] border-white bg-gradient-to-br from-sky-50 to-cyan-50 shadow-xl sm:h-32 sm:w-32">
                  {primaryImage ? (
                    <Image
                      src={primaryImage.url}
                      alt={business.name}
                      fill
                      unoptimized
                      sizes="128px"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl font-black text-sky-500">
                      د
                    </div>
                  )}

                  {business.isVerified && (
                    <div className="absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg ring-2 ring-white">
                      <BadgeCheck className="h-5 w-5" />
                    </div>
                  )}
                </div>

                {/* Title */}
                <div className="min-w-0 pb-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <DashboardStatusBadge status={business.status} />

                    {business.isVerified && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-600">
                        <BadgeCheck className="h-4 w-4" />
                        نشاط موثق
                      </span>
                    )}
                  </div>

                  <h1 className="truncate text-2xl font-black tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
                    {business.name}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-sky-500" />
                      نشاط تجاري
                    </span>

                    {location?.city && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-sky-500" />
                        {location.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/businesses/${business.slug}`}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600 hover:shadow-md"
                >
                  <ExternalLink className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                  عرض الصفحة
                </Link>

                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-100 hover:shadow-md"
                  >
                    <MapPin className="h-4 w-4 transition-transform group-hover:scale-110" />
                    الموقع على الخريطة
                  </a>
                )}

                <Link
                  href={`/dashboard/businesses/${business.id}/hours`}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm font-bold text-sky-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-50 hover:shadow-md"
                >
                  <Clock3 className="h-4 w-4 transition-transform group-hover:scale-110" />
                  ساعات العمل
                </Link>

                <Link
                  href={`/dashboard/businesses/${business.id}/offers`}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-100 hover:shadow-md"
                >
                  <Megaphone className="h-4 w-4 transition-transform group-hover:scale-110" />
                  إدارة العروض
                </Link>

                <Link
                  href={`/dashboard/businesses/${business.id}/edit`}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-sky-600 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-200 transition-all duration-200 hover:-translate-y-0.5 hover:from-sky-700 hover:to-cyan-600 hover:shadow-xl hover:shadow-sky-200"
                >
                  <Pencil className="h-4 w-4 transition-transform group-hover:rotate-[-8deg]" />
                  تعديل النشاط
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Star className="h-5 w-5" />}
            label="التقييمات"
            value={reviewsCount}
            description="تقييم منشور"
            iconClass="bg-amber-50 text-amber-500"
          />

          <StatCard
            icon={<Heart className="h-5 w-5" />}
            label="المفضلة"
            value={favoritesCount}
            description="مستخدم حفظ نشاطك"
            iconClass="bg-rose-50 text-rose-500"
          />

          <StatCard
            icon={<MessageCircle className="h-5 w-5" />}
            label="الطلبات"
            value={requestsCount}
            description={`${pendingRequests} قيد التنفيذ • ${completedRequests} مكتملة`}
            iconClass="bg-sky-50 text-sky-500"
          />


          <StatCard
            icon={<Wrench className="h-5 w-5" />}
            label="الخدمات"
            value={business.services.length}
            description="خدمة مضافة"
            iconClass="bg-emerald-50 text-emerald-500"
          />

          <StatCard
            icon={<Megaphone className="h-5 w-5" />}
            label="العروض"
            value={offersCount}
            description="عرض منشور"
            iconClass="bg-orange-50 text-orange-500"
          />
        </section>

        <div className="mt-5 flex justify-end">
          <Link
            href={`/dashboard/businesses/${business.id}/offers`}
            className="inline-flex items-center gap-2 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-black text-orange-600 transition hover:bg-orange-100"
          >
            <Megaphone className="h-4 w-4" />
            إدارة العروض
          </Link>
        </div>

        {/* Main */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            {/* About */}
            <DashboardSection
              eyebrow="نبذة النشاط"
              title="عن نشاطك"
              icon={<Building2 className="h-5 w-5" />}
              action={
                <EditLink
                  href={`/dashboard/businesses/${business.id}/edit`}
                />
              }
            >
              <p className="text-sm leading-8 text-slate-600">
                {business.description ||
                  "لم تتم إضافة وصف للنشاط حتى الآن. أضف وصفًا واضحًا ليساعد العملاء على معرفة خدماتك وما يميز نشاطك."}
              </p>
            </DashboardSection>

            {/* Categories */}
            <DashboardSection
              eyebrow="التصنيفات"
              title="تصنيفات النشاط"
              icon={<Sparkles className="h-5 w-5" />}
              action={
                <Link
                  href={`/dashboard/businesses/${business.id}/edit`}
                  className="rounded-lg px-3 py-2 text-xs font-bold text-sky-600 transition hover:bg-sky-50"
                >
                  تعديل
                </Link>
              }
            >
              {business.categories.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {business.categories.map(({ category }) => (
                    <span
                      key={category.id}
                      className="rounded-xl border border-sky-100 bg-gradient-to-l from-sky-50 to-cyan-50 px-4 py-2.5 text-sm font-bold text-sky-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-sm"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              ) : (
                <EmptyMessage text="لم تتم إضافة تصنيفات لهذا النشاط." />
              )}
            </DashboardSection>

            {/* Services */}
            <DashboardSection
              eyebrow="الخدمات"
              title="الخدمات التي تقدمها"
              icon={<Wrench className="h-5 w-5" />}
              action={
                <Link
                  href={`/dashboard/businesses/${business.id}/edit`}
                  className="rounded-lg px-3 py-2 text-xs font-bold text-sky-600 transition hover:bg-sky-50"
                >
                  تعديل
                </Link>
              }
            >
              {business.services.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {business.services.map(({ service }) => (
                    <div
                      key={service.id}
                      className="group rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-sky-100 hover:bg-sky-50/60 hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sky-500 shadow-sm transition-colors group-hover:bg-sky-500 group-hover:text-white">
                          <Wrench className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="font-bold text-slate-800">
                            {service.name}
                          </p>

                          {service.category && (
                            <p className="mt-1 text-xs text-slate-400">
                              {service.category.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyMessage text="لم تتم إضافة خدمات لهذا النشاط." />
              )}
            </DashboardSection>

            {/* Images */}
            <DashboardSection
              eyebrow="معرض الصور"
              title="صور النشاط"
              icon={<Building2 className="h-5 w-5" />}
              action={
                <Link
                  href={`/dashboard/businesses/${business.id}/edit`}
                  className="rounded-lg px-3 py-2 text-xs font-bold text-sky-600 transition hover:bg-sky-50"
                >
                  إدارة الصور
                </Link>
              }
            >
              {business.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {business.images.map((image) => (
                    <div
                      key={image.id}
                      className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100"
                    >
                      <Image
                        src={image.url}
                        alt={image.altText || business.name}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      {image.isPrimary && (
                        <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black text-sky-600 shadow-sm backdrop-blur-sm">
                          الصورة الرئيسية
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
                    <Building2 className="h-5 w-5" />
                  </div>

                  <p className="mt-3 text-sm font-bold text-slate-700">
                    لا توجد صور بعد
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    أضف صورًا جذابة لعرض نشاطك للعملاء.
                  </p>
                </div>
              )}
            </DashboardSection>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Contact */}
            <DashboardSection
              eyebrow="التواصل"
              title="معلومات التواصل"
              icon={<Phone className="h-5 w-5" />}
            >
              {hasContactInfo ? (
                <div className="space-y-3">
                  {business.phone && (
                    <a
                      href={`tel:${business.phone}`}
                      className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 transition-all hover:-translate-y-0.5 hover:border-sky-100 hover:bg-sky-50 hover:shadow-sm"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sky-500 shadow-sm group-hover:bg-sky-500 group-hover:text-white">
                        <Phone className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">
                          الهاتف
                        </p>
                        <p className="truncate text-sm font-bold text-slate-700">
                          {business.phone}
                        </p>
                      </div>
                    </a>
                  )}

                  {business.whatsapp && (
                    <a
                      href={`https://wa.me/${business.whatsapp
                        .replace(/[^\d+]/g, "")
                        .replace(/^\+/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 transition-all hover:-translate-y-0.5 hover:border-emerald-100 hover:bg-emerald-50 hover:shadow-sm"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-500 shadow-sm group-hover:bg-emerald-500 group-hover:text-white">
                        <MessageCircle className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">
                          واتساب
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                          التواصل عبر WhatsApp
                        </p>
                      </div>
                    </a>
                  )}

                  {business.website && (
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 transition-all hover:-translate-y-0.5 hover:border-sky-100 hover:bg-sky-50 hover:shadow-sm"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sky-500 shadow-sm group-hover:bg-sky-500 group-hover:text-white">
                        <Globe className="h-4 w-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">
                          الموقع الإلكتروني
                        </p>
                        <p className="truncate text-sm font-bold text-slate-700">
                          زيارة الموقع
                        </p>
                      </div>
                    </a>
                  )}
                </div>
              ) : (
                <EmptyMessage text="لم تتم إضافة معلومات التواصل بعد." />
              )}
            </DashboardSection>

            {/* Location */}
            <DashboardSection
              eyebrow="الموقع"
              title="موقع النشاط"
              icon={<MapPin className="h-5 w-5" />}
            >
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                <div className="relative h-36 bg-gradient-to-br from-sky-100 via-cyan-50 to-slate-100">
                  <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(14,165,233,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,.15)_1px,transparent_1px)] [background-size:24px_24px]" />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-xl shadow-sky-300/50 ring-8 ring-white/60">
                      <MapPin className="h-6 w-6" />
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-sm leading-7 text-slate-600">
                    {[
                      location?.address,
                      location?.district,
                      location?.city,
                    ]
                      .filter(Boolean)
                      .join("، ") || "لم تتم إضافة موقع النشاط بعد."}
                  </p>

                  {mapUrl && (
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-sky-600 transition hover:text-sky-700"
                    >
                      فتح الموقع على الخريطة
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </DashboardSection>

            {/* Hours */}
            <DashboardSection
              eyebrow="ساعات العمل"
              title="أوقات الدوام"
              icon={<Sparkles className="h-5 w-5" />}
              action={
                <Link
                  href={`/dashboard/businesses/${business.id}/hours`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-sky-600 transition hover:bg-sky-50"
                >
                  <Clock3 className="h-3.5 w-3.5" />
                  إدارة الساعات
                </Link>
              }
            >
              {hasHours ? (
                <div className="space-y-2">
                  {business.hours.map((hour) => (
                    <div
                      key={hour.id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5"
                    >
                      <span className="text-xs font-bold text-slate-600">
                        {dayLabels[hour.dayOfWeek] || hour.dayOfWeek}
                      </span>

                      <span
                        className={`text-xs font-bold ${
                          hour.isClosed
                            ? "text-rose-500"
                            : "text-emerald-600"
                        }`}
                      >
                        {hour.isClosed
                          ? "مغلق"
                          : `${hour.opensAt} - ${hour.closesAt}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyMessage text="لم تتم إضافة ساعات العمل بعد." />
              )}
            </DashboardSection>

            {/* Status */}
            <section className="relative overflow-hidden rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-xl">
              <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-sky-500/20 blur-2xl" />
              <div className="absolute -bottom-16 -right-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                    <BadgeCheck className="h-5 w-5 text-sky-400" />
                  </div>

                  <div>
                    <h2 className="font-black">حالة النشاط</h2>
                    <p className="mt-0.5 text-xs text-slate-400">
                      الحالة الحالية في المنصة
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <DashboardStatusBadge status={business.status} />
                </div>

                <p className="mt-4 text-xs leading-7 text-slate-400">
                  {business.status === "PENDING"
                    ? "النشاط قيد مراجعة الإدارة وسيظهر للجمهور بعد الموافقة."
                    : business.status === "ACTIVE"
                      ? "النشاط منشور حاليًا ويمكن للمستخدمين اكتشافه."
                      : business.status === "REJECTED"
                        ? "تم رفض النشاط. يمكنك مراجعة البيانات وتعديلها."
                        : "النشاط غير متاح حاليًا للجمهور."}
                </p>

                {business.status === "REJECTED" && (
                  <Link
                    href={`/dashboard/businesses/${business.id}/edit`}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-sky-50"
                  >
                    مراجعة وتعديل البيانات
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
  iconClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
  iconClass: string;
}) {
  return (
    <div className="group rounded-2xl border border-white/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-100/60">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-500">
          {label}
        </span>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${iconClass}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-4 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-400">
        {description}
      </p>
    </div>
  );
}

function DashboardSection({
  eyebrow,
  title,
  icon,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="group rounded-[1.75rem] border border-white/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-sky-100/40 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-500 transition-all duration-300 group-hover:bg-sky-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-sky-200">
            {icon}
          </div>

          <div>
            <p className="text-xs font-black text-sky-600">
              {eyebrow}
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-950">
              {title}
            </h2>
          </div>
        </div>

        {action}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

function EditLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      aria-label="تعديل"
      className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all duration-200 hover:-translate-y-0.5 hover:bg-sky-50 hover:text-sky-600 hover:shadow-sm"
    >
      <Pencil className="h-4 w-4" />
    </Link>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center">
      <p className="text-sm font-medium text-slate-400">{text}</p>
    </div>
  );
}
