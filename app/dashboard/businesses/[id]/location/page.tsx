
import Link from "next/link";
import {
  ArrowRight,
  MapPin,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

import BusinessLocationPicker from "@/components/map/business-location-picker";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BusinessLocationPage({
  params,
}: PageProps) {
  const { id } = await params;

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const business =
    await prisma.business.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        ownerId: true,
        locations: {
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
          select: {
            latitude: true,
            longitude: true,
            address: true,
            city: true,
            district: true,
          },
        },
      },
    });

  if (!business) {
    notFound();
  }

  const isOwner =
    business.ownerId === session.user.id;

  const isAdmin =
    session.user.role === "ADMIN" ||
    session.user.role === "SUPER_ADMIN";

  if (!isOwner && !isAdmin) {
    redirect("/dashboard/businesses");
  }

  const location =
    business.locations[0];

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#f0f9ff] px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href={`/dashboard/businesses/${business.id}`}
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition hover:text-sky-700"
            >
              <ArrowRight className="h-4 w-4" />
              العودة إلى النشاط
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                <MapPin className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-2xl font-black text-slate-900">
                  موقع النشاط
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  {business.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        <BusinessLocationPicker
          businessId={business.id}
          initialLatitude={
            location?.latitude
              ? Number(location.latitude)
              : null
          }
          initialLongitude={
            location?.longitude
              ? Number(location.longitude)
              : null
          }
        />
      </div>
    </div>
  );
}
