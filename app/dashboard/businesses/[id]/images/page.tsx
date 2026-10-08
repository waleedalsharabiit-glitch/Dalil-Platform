
import Link from "next/link";
import { ArrowRight, ImageIcon, Sparkles } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

import BusinessImagesManager from "@/components/business/business-images-manager";

interface BusinessImagesPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BusinessImagesPage({
  params,
}: BusinessImagesPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    redirect("/login");
  }

  const business = await prisma.business.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
    },
  });

  if (!business) {
    notFound();
  }

  const isAdmin =
    session.user.role === "ADMIN" ||
    session.user.role === "SUPER_ADMIN";

  const isOwner =
    session.user.role === "BUSINESS_OWNER" &&
    business.ownerId === session.user.id;

  if (!isAdmin && !isOwner) {
    redirect("/dashboard/businesses");
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f0f9ff] px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <section className="relative mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-600 via-sky-500 to-blue-600 p-6 text-white shadow-xl shadow-sky-200 sm:p-8">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-1/3 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative">
            <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
              <Link
                href="/dashboard/businesses"
                className="rounded-lg px-2 py-1 text-sky-100 transition hover:bg-white/10 hover:text-white"
              >
                أنشطتي
              </Link>

              <ArrowRight className="h-4 w-4 text-sky-200" />

              <Link
                href={`/dashboard/businesses/${business.id}`}
                className="rounded-lg px-2 py-1 text-sky-100 transition hover:bg-white/10 hover:text-white"
              >
                {business.name}
              </Link>

              <ArrowRight className="h-4 w-4 text-sky-200" />

              <span className="font-bold text-white">
                الصور
              </span>
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5" />
                  إدارة معرض النشاط
                </div>

                <h1 className="text-2xl font-black sm:text-3xl">
                  صور {business.name}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-7 text-sky-50">
                  أضف الصور ورتبها وحدد الصورة الرئيسية التي
                  ستظهر للعملاء في واجهة النشاط.
                </p>
              </div>

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/15 shadow-inner backdrop-blur">
                <ImageIcon className="h-8 w-8" />
              </div>
            </div>
          </div>
        </section>

        <BusinessImagesManager
          businessId={business.id}
          businessName={business.name}
        />
      </div>
    </main>
  );
}
