import type { ElementType } from "react";

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: ElementType;
  tone?: "sky" | "green" | "amber" | "rose" | "violet";
}

const toneClasses = {
  sky: {
    icon: "bg-sky-50 text-sky-600",
    glow: "group-hover:shadow-sky-100",
  },
  green: {
    icon: "bg-emerald-50 text-emerald-600",
    glow: "group-hover:shadow-emerald-100",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600",
    glow: "group-hover:shadow-amber-100",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600",
    glow: "group-hover:shadow-rose-100",
  },
  violet: {
    icon: "bg-violet-50 text-violet-600",
    glow: "group-hover:shadow-violet-100",
  },
};

export default function DashboardStatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "sky",
}: DashboardStatCardProps) {
  const styles = toneClasses[tone];

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${styles.glow}`}
    >
      <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-slate-50 opacity-60 transition duration-500 group-hover:scale-150" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${styles.icon}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
