
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquareText,
  Star,
} from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export default async function ReviewsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const reviews = await prisma.review.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: {
            orderBy: {
              sortOrder: "asc",
            },
            take: 1,
          },
        },
      },
    },
  });

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f0f9ff] px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-5xl">
        <header className="mb-7">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
            <Star className="h-6 w-6 fill-current" />
          </div>

          <p className="mt-5 text-xs font-black tracking-[0.2em] text-sky-600">
            REVIEWS
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900">
            تقييماتي
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            جميع تقييماتك وآرائك التي شاركتها مع المجتمع.
          </p>
        </header>

        {reviews.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
            <MessageSquareText className="mx-auto h-10 w-10 text-slate-300" />

            <h2 className="mt-5 font-black text-slate-900">
              لم تضف أي تقييم بعد
            </h2>

            <Link
              href="/businesses"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-black text-white"
            >
              استكشف الأنشطة
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Link
                key={review.id}
                href={`/businesses/${review.business.slug}`}
                className="group flex flex-col gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-lg sm:flex-row"
              >
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-sky-50">
                  {review.business.images[0]?.url ? (
                    <img
                      src={review.business.images[0].url}
                      alt={review.business.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sky-300">
                      <MessageSquareText className="h-7 w-7" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-black text-slate-900 group-hover:text-sky-600">
                      {review.business.name}
                    </h2>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(
                        (star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        ),
                      )}
                    </div>
                  </div>

                  {review.comment && (
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {review.comment}
                    </p>
                  )}

                  <p className="mt-3 text-xs text-slate-400">
                    {new Intl.DateTimeFormat(
                      "ar-YE",
                      {
                        dateStyle: "medium",
                      },
                    ).format(review.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
