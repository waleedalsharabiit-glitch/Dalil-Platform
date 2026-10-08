
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  MapPin,
  Star,
} from "lucide-react";

import type { BusinessStatus } from "@/generated/prisma/client";

import DashboardStatusBadge from "./dashboard-status-badge";

interface DashboardBusinessCardProps {
  id: string;
  name: string;
  slug: string;
  status: BusinessStatus;
  isVerified: boolean;
  city?: string | null;
  district?: string | null;
  imageUrl?: string | null;
  reviewsCount: number;
  rating: number;
  categoriesCount: number;
  servicesCount: number;
}

export default function DashboardBusinessCard({
  id,
  name,
  slug,
  status,
  isVerified,
  city,
  district,
  imageUrl,
  reviewsCount,
  rating,
  categoriesCount,
  servicesCount,
}: DashboardBusinessCardProps) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-sky-100 via-white to-slate-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 50vw"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-3xl font-black text-sky-500 shadow-xl">
              د
            </div>
          </div>
        )}

        <div className="absolute right-4 top-4">
          <DashboardStatusBadge status={status} />
        </div>

        {isVerified && (
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-sky-600 shadow-lg backdrop-blur">
            <BadgeCheck className="h-4 w-4" />
            موثق
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-black text-slate-900">
              {name}
            </h3>

            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5" />
              <span>
                {city || district
                  ? [district, city]
                      .filter(Boolean)
                      .join("، ")
                  : "لم تتم إضافة الموقع"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
            <Star className="h-4 w-4 fill-current" />
            {rating > 0 ? rating.toFixed(1) : "جديد"}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 divide-x divide-x-reverse divide-slate-100 rounded-xl bg-slate-50 py-3">
          <div className="text-center">
            <p className="text-sm font-black text-slate-900">
              {categoriesCount}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              تصنيفات
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm font-black text-slate-900">
              {servicesCount}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              خدمات
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm font-black text-slate-900">
              {reviewsCount}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              تقييمات
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href={`/dashboard/businesses/${id}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-sky-600"
          >
            إدارة النشاط
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <Link
            href={`/businesses/${slug}`}
            className="flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600"
          >
            <Building2 className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
