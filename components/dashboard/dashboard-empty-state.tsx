
import Link from "next/link";
import { Building2, Plus } from "lucide-react";

interface DashboardEmptyStateProps {
  title: string;
  description: string;
  action?: boolean;
}

export default function DashboardEmptyState({
  title,
  description,
  action = true,
}: DashboardEmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-50 text-sky-500">
        <Building2 className="h-9 w-9" />
      </div>

      <h3 className="mt-5 text-xl font-black text-slate-900">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
        {description}
      </p>

      {action && (
        <Link
          href="/business/create"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-600"
        >
          <Plus className="h-4 w-4" />
          إضافة نشاط جديد
        </Link>
      )}
    </div>
  );
}