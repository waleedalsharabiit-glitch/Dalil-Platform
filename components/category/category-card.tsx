
import Image from "next/image";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Car,
  Code2,
  Computer,
  Construction,
  HeartPulse,
  Home,
  Laptop,
  Network,
  Paintbrush,
  Package,
  Palette,
  Phone,
  Pill,
  Printer,
  Store,
  Utensils,
} from "lucide-react";
import type { ElementType } from "react";

interface CategoryCardProps {
  name: string;
  slug: string;
  icon?: string | null;
  image?: string | null;
  description?: string | null;
}

const iconMap: Record<string, ElementType> = {
  laptop: Laptop,
  computer: Computer,
  phone: Phone,
  network: Network,
  restaurant: Utensils,
  pharmacy: Pill,
  health: HeartPulse,
  car: Car,
  mechanic: Car,
  home: Home,
  construction: Construction,
  printing: Printer,
  beauty: Palette,
  paint: Paintbrush,
  package: Package,
  business: Store,
  code: Code2,
};

export default function CategoryCard({
  name,
  slug,
  icon,
  image,
  description,
}: CategoryCardProps) {
  const Icon = iconMap[icon ?? ""] ?? BriefcaseBusiness;

  return (
    <Link
      href={`/categories/${slug}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-100/50"
    >
      <div className="relative h-28 overflow-hidden bg-slate-100">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            unoptimized
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-sky-100 via-white to-cyan-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 text-sky-600 shadow-sm">
              <Icon className="h-6 w-6" />
            </div>
          </div>
        )}
      </div>

      <div className="flex h-full flex-col p-5">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-colors group-hover:bg-sky-100">
          <Icon className="h-6 w-6" />
        </div>

        <h3 className="font-bold text-slate-900 transition-colors group-hover:text-sky-600">
          {name}
        </h3>

        {description && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}

        <div className="mt-auto pt-4 text-xs font-semibold text-sky-600">
          اكتشف الخدمات
        </div>
      </div>
    </Link>
  );
}
