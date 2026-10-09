
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
      className="group block overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-100/60"
    >
      <div
        className="relative h-36 overflow-hidden bg-slate-100"
        style={
          image
            ? {
                backgroundImage: `linear-gradient(135deg, rgba(14,165,233,0.35), rgba(15,23,42,0.45)), url(${image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {!image && (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-sky-100 via-white to-cyan-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 text-sky-600 shadow-sm">
              <Icon className="h-6 w-6" />
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/10 to-transparent" />

        <div className="absolute right-4 top-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/40 bg-white/15 text-white backdrop-blur-sm">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="flex h-full flex-col p-5">
        <h3 className="font-black text-slate-900 transition-colors group-hover:text-sky-600">
          {name}
        </h3>

        {description && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-4 text-xs font-bold text-sky-600">
          <span>اكتشف الخدمات</span>
          <span aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  );
}
