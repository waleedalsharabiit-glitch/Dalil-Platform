
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Globe,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Star,
  Wrench,
} from "lucide-react";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { getReviewSummary, sortReviews, type ReviewSort } from "@/lib/reviews/review-metrics";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";
import ServiceRequestForm from "@/components/business/service-request-form";
import ReviewForm from "@/components/business/review-form";
import FavoriteButton from "@/components/business/favorite-button";
import ReportForm from "@/components/admin/report-form";

interface BusinessDetailsPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    sort?: string;
  }>;
}

function formatPhoneForWhatsApp(phone: string) {
  return phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
}

function normalizeReviewSort(sort?: string): ReviewSort {
  if (sort === "highest" || sort === "lowest") {
    return sort;
  }

  return "newest";
}

export default async function BusinessDetailsPage({
  params,
  searchParams,
}: BusinessDetailsPageProps) {
  const { slug } = await params;
  const { sort } = (await searchParams) ?? {};
  const session = await auth();

  const business = await prisma.business.findUnique({
    where: {
      slug,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
        },
      },

      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },

      services: {
        include: {
          service: {
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

      reviews: {
        where: {
          isPublished: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },

      offers: {
        where: {
          status: "ACTIVE",
          startsAt: {
            lte: new Date(),
          },
          endsAt: {
            gte: new Date(),
          },
        },
        orderBy: {
          endsAt: "asc",
        },
      },

      _count: {
        select: {
          reviews: {
            where: {
              isPublished: true,
            },
          },
        },
      },
    },
  });

  if (!business) {
    notFound();
  }

  const isOwner = session?.user?.id === business.ownerId;

  const isAdmin =
    session?.user?.role === "ADMIN" ||
    session?.user?.role === "SUPER_ADMIN";

  /*
   * النشاطات غير النشطة لا تظهر للعامة.
   * صاحب النشاط والإدارة يستطيعون رؤية النشاط أثناء المراجعة.
   */
  if (business.status !== "ACTIVE" && !isOwner && !isAdmin) {
    notFound();
  }

  const location = business.locations[0];
  const reviewSort = normalizeReviewSort(sort);
  const publishedReviews = business.reviews;
  const orderedReviews = sortReviews(publishedReviews, reviewSort);
  const reviewSummary = getReviewSummary(publishedReviews);

  const reviewsTotal = business._count.reviews;

  /*
   * إذا كانت الصفحة تحتوي على آخر 6 تقييمات فقط، لا نريد تسمية
   * المتوسط بأنه المتوسط الكامل إذا لم تكن لدينا كل التقييمات.
   *
   * لذلك نستخدم aggregate منفصل لحساب المتوسط الحقيقي.
   */
  const ratingAggregate = await prisma.review.aggregate({
    where: {
      businessId: business.id,
      isPublished: true,
    },
    _avg: {
      rating: true,
    },
  });



  const averageRating = ratingAggregate._avg.rating ?? 0;

  const userFavorite = session?.user?.id
    ? await prisma.favorite.findUnique({
        where: {
          userId_businessId: {
            userId: session.user.id,
            businessId: business.id,
          },
        },
        select: {
          id: true,
        },
      })
    : null;

  const userReview = session?.user?.id
    ? await prisma.review.findUnique({
        where: {
          userId_businessId: {
            userId: session.user.id,
            businessId: business.id,
          },
        },
        select: {
          id: true,
          rating: true,
          comment: true,
        },
      })
    : null;

  const whatsappNumber = business.whatsapp
    ? formatPhoneForWhatsApp(business.whatsapp)
    : null;

  const mapUrl =
    location?.latitude != null && location?.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`
      : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <main>
        {/* Breadcrumb */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm text-slate-500">
              <Link
                href="/"
                className="transition-colors hover:text-sky-600"
              >
                الرئيسية
              </Link>

              <ArrowRight className="h-4 w-4 rotate-180 text-slate-400" />

              <Link
                href="/businesses"
                className="transition-colors hover:text-sky-600"
              >
                الأنشطة
              </Link>

              <ArrowRight className="h-4 w-4 rotate-180 text-slate-400" />

              <span className="max-w-[220px] truncate font-medium text-slate-700">
                {business.name}
              </span>
            </nav>
          </div>
        </section>

        {/* Pending banner */}
        {business.status === "PENDING" && (
          <section className="border-b border-amber-200 bg-amber-50">
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-start gap-3 text-sm text-amber-800">
                <Building2 className="mt-0.5 h-5 w-5 shrink-0" />

                <div>
                  <p className="font-bold">هذا النشاط قيد المراجعة</p>

                  <p className="mt-1 leading-6">
                    لن يظهر النشاط للمستخدمين بشكل عام حتى تتم الموافقة
                    عليه من الإدارة.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Hero */}
        <section className="border-b border-slate-200 bg-gradient-to-b from-sky-50 to-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {business.isVerified && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1.5 text-xs font-bold text-sky-700">
                      <BadgeCheck className="h-4 w-4" />
                      نشاط موثق
                    </span>
                  )}

                  {business.status === "PENDING" && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
                      قيد المراجعة
                    </span>
                  )}

                  {business.status === "ACTIVE" && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
                      نشط
                    </span>
                  )}
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  {business.name}
                </h1>

                {location && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-5 w-5 shrink-0 text-sky-500" />

                    <span>
                      {[
                        location.address,
                        location.district,
                        location.city,
                      ]
                        .filter(Boolean)
                        .join("، ")}
                    </span>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">
                      <Star className="h-4 w-4 fill-current" />

                      {averageRating > 0
                        ? averageRating.toFixed(1)
                        : "لا يوجد"}
                    </span>

                    <span className="text-sm text-slate-500">
                      ({reviewsTotal} تقييم)
                    </span>
                  </div>

                  <span className="hidden h-5 w-px bg-slate-300 sm:block" />

                  <span className="text-sm text-slate-500">
                    {business.categories.length} تصنيف
                  </span>

                  <span className="text-sm text-slate-500">
                    {business.services.length} خدمة
                  </span>
                </div>

                {business.description && (
                  <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">
                    {business.description}
                  </p>
                )}

                <div className="mt-6">
                  <FavoriteButton
                    businessId={business.id}
                    initialFavorite={Boolean(userFavorite)}
                  />
                </div>

                <div className="mt-3">
                  <ReportForm
                    type="BUSINESS"
                    targetId={business.id}
                    isAuthenticated={Boolean(session?.user?.id)}
                  />
                </div>

                {/* Categories */}
                {business.categories.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {business.categories.map(({ category }) => (
                      <Link
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:border-sky-400 hover:bg-sky-50"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact card */}
              <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-slate-900">
                  تواصل مع النشاط
                </h2>

                <div className="mt-5 space-y-3">
                  {business.status === "ACTIVE" && !isOwner && (
                    <ServiceRequestForm
                      businessId={business.id}
                      services={business.services.map(({ service }) => ({
                        id: service.id,
                        name: service.name,
                      }))}
                      isAuthenticated={Boolean(session?.user?.id)}
                    />
                  )}

                  {business.phone && (
                    <a
                      href={`tel:${business.phone}`}
                      className="flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-bold text-white transition hover:bg-sky-600"
                    >
                      <Phone className="h-4 w-4" />
                      اتصال هاتفي
                    </a>
                  )}

                  {whatsappNumber && (
                    <a
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-12 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <MessageCircle className="h-4 w-4" />
                      التواصل عبر WhatsApp
                    </a>
                  )}

                  {business.website && (
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                    >
                      <Globe className="h-4 w-4" />
                      زيارة الموقع الإلكتروني
                    </a>
                  )}

                  {mapUrl && (
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                    >
                      <Navigation className="h-4 w-4" />
                      فتح الموقع على الخريطة
                    </a>
                  )}
                </div>

                {!business.phone &&
                  !business.whatsapp &&
                  !business.website && (
                    <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-center text-sm leading-6 text-slate-500">
                      لا توجد وسائل تواصل مضافة حاليًا.
                    </p>
                  )}
              </aside>
            </div>
          </div>
        </section>

        {/* Main content */}
        <section className="py-8 sm:py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
              <div className="space-y-8">
                {/* Services */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                      <Wrench className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        الخدمات
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        الخدمات التي يقدمها هذا النشاط
                      </p>
                    </div>
                  </div>

                  {business.services.length > 0 ? (
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {business.services.map(({ service }) => (
                        <div
                          key={service.id}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <p className="font-bold text-slate-800">
                            {service.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {service.category.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      لم تتم إضافة خدمات لهذا النشاط بعد.
                    </div>
                  )}
                </section>

                {/* Offers */}
                {business.offers.length > 0 && (
                  <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm sm:p-7">
                    <h2 className="text-xl font-black text-slate-900">
                      العروض الحالية
                    </h2>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      {business.offers.map((offer) => (
                        <article
                          key={offer.id}
                          className="overflow-hidden rounded-2xl border border-amber-100 bg-white"
                        >
                          {offer.imageUrl && (
                            <div className="relative h-36 bg-slate-100">
                              <Image
                                src={offer.imageUrl}
                                alt=""
                                fill
                                unoptimized
                                sizes="(max-width: 640px) 100vw, 50vw"
                                className="object-cover"
                              />
                            </div>
                          )}

                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="font-bold text-slate-900">
                                {offer.title}
                              </h3>

                              {offer.discount && (
                                <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">
                                  {offer.discount.toString()}%
                                </span>
                              )}
                            </div>

                            {offer.description && (
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {offer.description}
                              </p>
                            )}

                            <p className="mt-3 text-xs text-slate-400">
                              ينتهي في{" "}
                              {offer.endsAt.toLocaleDateString("ar-SA")}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                {/* Reviews */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        التقييمات
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        آراء المستخدمين حول هذا النشاط
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-5 w-5 fill-current" />

                        <span className="text-lg font-black">
                          {averageRating > 0
                            ? averageRating.toFixed(1)
                            : "—"}
                        </span>
                      </div>

                      <span className="text-sm text-slate-500">
                        من {reviewsTotal} تقييم
                      </span>
                    </div>
                  </div>

                  {reviewSummary.total > 0 && (
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-slate-500">
                            متوسط التقييم
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-2xl font-black text-slate-900">
                              {reviewSummary.average.toFixed(1)}
                            </span>
                            <div className="flex items-center gap-1 text-amber-500">
                              {Array.from({ length: 5 }).map((_, index) => (
                                <Star
                                  key={index}
                                  className={`h-4 w-4 ${
                                    index < Math.round(reviewSummary.average)
                                      ? "fill-current"
                                      : "text-slate-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="w-full max-w-sm space-y-2">
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = reviewSummary.distribution[star as 1 | 2 | 3 | 4 | 5];
                            const percentage = reviewSummary.total
                              ? (count / reviewSummary.total) * 100
                              : 0;

                            return (
                              <div key={star} className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="w-4 text-left font-bold text-slate-600">{star}</span>
                                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                                  <div
                                    className="h-full rounded-full bg-amber-400"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="w-6 text-left text-slate-500">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
                    {[
                      { value: "newest", label: "الأحدث" },
                      { value: "highest", label: "الأعلى تقييماً" },
                      { value: "lowest", label: "الأدنى تقييماً" },
                    ].map((option) => {
                      const isActive = reviewSort === option.value;

                      return (
                        <a
                          key={option.value}
                          href={`/businesses/${slug}${option.value === "newest" ? "" : `?sort=${option.value}`}`}
                          className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                            isActive
                              ? "border-sky-200 bg-sky-50 text-sky-700"
                              : "border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-600"
                          }`}
                        >
                          {option.label}
                        </a>
                      );
                    })}
                  </div>

                  {orderedReviews.length > 0 ? (
                    <div className="mt-6 divide-y divide-slate-100">
                      {orderedReviews.map((review) => (
                        <article
                          key={review.id}
                          className="py-5 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-bold text-slate-800">
                                {review.user.name || "مستخدم"}
                              </p>

                              <div className="mt-1 flex items-center gap-1 text-amber-500">
                                {Array.from({ length: 5 }).map(
                                  (_, index) => (
                                    <Star
                                      key={index}
                                      className={`h-4 w-4 ${
                                        index < review.rating
                                          ? "fill-current"
                                          : "text-slate-300"
                                      }`}
                                    />
                                  ),
                                )}
                              </div>
                            </div>

                            <time
                              dateTime={review.createdAt.toISOString()}
                              className="text-xs text-slate-400"
                            >
                              {review.createdAt.toLocaleDateString("ar-YE")}
                            </time>
                          </div>

                          {review.comment && (
                            <p className="mt-3 text-sm leading-7 text-slate-600">
                              {review.comment}
                            </p>
                          )}

                          <div className="mt-3">
                            <ReportForm
                              type="REVIEW"
                              targetId={review.id}
                              isAuthenticated={Boolean(session?.user?.id)}
                            />
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-xl bg-slate-50 px-4 py-8 text-center">
                      <Star className="mx-auto h-8 w-8 text-slate-300" />

                      <p className="mt-3 text-sm font-semibold text-slate-600">
                        لا توجد تقييمات حتى الآن
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        كن أول من يقيّم هذا النشاط عند تفعيل نظام التقييمات.
                      </p>
                    </div>
                  )}

                  {business.status === "ACTIVE" && !isOwner && (
                    session?.user?.id ? (
                      <ReviewForm
                        businessId={business.id}
                        existingReview={userReview}
                      />
                    ) : (
                      <div className="mt-6 rounded-[1.5rem] border border-sky-100 bg-sky-50 p-5 text-center">
                        <p className="text-sm font-bold text-sky-700">
                          سجّل الدخول لتقييم هذا النشاط
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          شارك تجربتك ومساعدة الآخرين على اتخاذ القرار.
                        </p>
                        <div className="mt-4 flex justify-center gap-3">
                          <Link
                            href="/login"
                            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-black text-white transition hover:bg-sky-700"
                          >
                            تسجيل الدخول
                          </Link>
                          <Link
                            href="/register"
                            className="rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-black text-sky-700 transition hover:bg-sky-100"
                          >
                            إنشاء حساب
                          </Link>
                        </div>
                      </div>
                    )
                  )}
                </section>

                {/* Active offers */}
               {business.offers.length > 0 && (
                  <section
                    dir="rtl"
                    className="mt-8 overflow-hidden rounded-[2rem] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 sm:p-8"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-[11px] font-black text-orange-700">
                          عروض حصرية
                        </span>

                        <h2 className="mt-3 text-2xl font-black text-slate-900">
                          عروض {business.name}
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                          استفد من أحدث الخصومات والعروض المتاحة.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {business.offers.map((offer) => (
                        <article
                          key={offer.id}
                          className="group overflow-hidden rounded-[1.5rem] border border-orange-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-100"
                        >
                          {offer.imageUrl && (
                            <div className="relative h-44 overflow-hidden">
                              <Image
                                src={offer.imageUrl}
                                alt={offer.title}
                                fill
                                unoptimized
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover transition duration-500 group-hover:scale-105"
                              />
                            </div>
                          )}

                          <div className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-black text-slate-900">
                                  {offer.title}
                                </h3>

                                {offer.description && (
                                  <p className="mt-2 text-sm leading-7 text-slate-500">
                                    {offer.description}
                                  </p>
                                )}
                              </div>

                             {offer.discount !== null && (
  <span className="shrink-0 rounded-2xl bg-orange-500 px-3 py-2 text-sm font-black text-white shadow-lg shadow-orange-200">
    {offer.discount.toString()}%
  </span>
)}
                            </div>

                            <div className="mt-5 flex items-center justify-between text-xs font-bold text-slate-400">
                              <span>
                                حتى{" "}
                                {new Intl.DateTimeFormat("ar-YE", {
                                  dateStyle: "medium",
                                }).format(new Date(offer.endsAt))}
                              </span>

                              <span className="font-black text-orange-600">
                                عرض متاح الآن
                              </span>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Location / Information sidebar */}
              <aside className="space-y-5">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="font-bold text-slate-900">
                    معلومات الموقع
                  </h2>

                  {location ? (
                    <div className="mt-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />

                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            العنوان
                          </p>

                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            {[
                              location.address,
                              location.district,
                              location.city,
                            ]
                              .filter(Boolean)
                              .join("، ") || "لم يتم تحديد العنوان"}
                          </p>
                        </div>
                      </div>

                      {mapUrl && (
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
                        >
                          <Navigation className="h-4 w-4" />
                          عرض على الخريطة
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm leading-6 text-slate-500">
                      لم تتم إضافة موقع للنشاط بعد.
                    </p>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="font-bold text-slate-900">
                    معلومات النشاط
                  </h2>

                  <div className="mt-5 space-y-4 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">الحالة</span>

                      <span className="font-semibold text-slate-800">
                        {business.status === "ACTIVE"
                          ? "نشط"
                          : business.status === "PENDING"
                            ? "قيد المراجعة"
                            : business.status === "SUSPENDED"
                              ? "موقوف"
                              : "مرفوض"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">التوثيق</span>

                      <span
                        className={
                          business.isVerified
                            ? "font-semibold text-emerald-600"
                            : "font-semibold text-slate-600"
                        }
                      >
                        {business.isVerified ? "موثق" : "غير موثق"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">التصنيفات</span>

                      <span className="font-semibold text-slate-800">
                        {business.categories.length}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-500">الخدمات</span>

                      <span className="font-semibold text-slate-800">
                        {business.services.length}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Owner hint */}
                {isOwner && (
                  <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
                    <h2 className="font-bold text-sky-900">
                      أنت مالك هذا النشاط
                    </h2>

                    <p className="mt-2 text-sm leading-7 text-sky-700">
                      سيتم لاحقًا إضافة لوحة تحكم خاصة بك لتعديل بيانات
                      النشاط وإدارة الصور وساعات العمل والعروض.
                    </p>
                  </section>
                )}
              </aside>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
