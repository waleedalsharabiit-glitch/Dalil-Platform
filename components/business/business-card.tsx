
// components/business/business-card.tsx

import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Star,
  BadgeCheck,
} from "lucide-react";

import { getImageUrlWithVariant } from "@/lib/storage/business-image-storage";

type BusinessCardProps = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  city?: string | null;
  district?: string | null;
  rating: number;
  reviewsCount: number;
  isVerified: boolean;
};

export default function BusinessCard({
  name,
  slug,
  description,
  imageUrl,
  city,
  district,
  rating,
  reviewsCount,
  isVerified,
}: BusinessCardProps) {
  const location = [district, city]
    .filter(Boolean)
    .join(" - ");

  const cardImageUrl = getImageUrlWithVariant(imageUrl, "card");

  return (
    <Link
      href={`/businesses/${slug}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-slate-200/60"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        {cardImageUrl ? (
          <Image
            src={cardImageUrl}
            alt={name}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 50vw"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-sky-50 to-slate-100">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-sky-500 shadow-sm">
              د
            </div>
          </div>
        )}

        {isVerified && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-xs font-bold text-sky-600 shadow-sm backdrop-blur">
            <BadgeCheck size={14} />
            موثّق
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-base font-bold text-slate-900 transition group-hover:text-sky-600">
            {name}
          </h3>

          <div className="flex shrink-0 items-center gap-1 text-sm font-bold text-amber-500">
            <Star size={15} fill="currentColor" />
            {rating > 0 ? rating.toFixed(1) : "جديد"}
          </div>
        </div>

        {description && (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
            {description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
            <MapPin
              size={14}
              className="shrink-0 text-sky-500"
            />

            <span className="truncate">
              {location || "الموقع غير محدد"}
            </span>
          </div>

          <span className="shrink-0 text-[11px] text-slate-400">
            {reviewsCount} تقييم
          </span>
        </div>
      </div>
    </Link>
  );
}
