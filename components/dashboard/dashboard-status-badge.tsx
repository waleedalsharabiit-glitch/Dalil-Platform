
import type { BusinessStatus } from "@/generated/prisma/client";

interface DashboardStatusBadgeProps {
  status: BusinessStatus;
}

const statusConfig: Record<
  BusinessStatus,
  {
    label: string;
    className: string;
  }
> = {
  PENDING: {
    label: "قيد المراجعة",
    className:
      "bg-amber-50 text-amber-700 ring-amber-200",
  },

  ACTIVE: {
    label: "نشط",
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },

  SUSPENDED: {
    label: "موقوف",
    className:
      "bg-rose-50 text-rose-700 ring-rose-200",
  },

  REJECTED: {
    label: "مرفوض",
    className:
      "bg-slate-100 text-slate-700 ring-slate-200",
  },
};

export default function DashboardStatusBadge({
  status,
}: DashboardStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${config.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}


