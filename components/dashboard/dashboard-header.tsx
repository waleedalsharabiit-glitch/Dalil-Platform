
import Link from "next/link";
import { Bell, Menu, Plus } from "lucide-react";

interface DashboardHeaderProps {
  name: string;
  roleLabel: string;
}

export default function DashboardHeader({
  name,
  roleLabel,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"
            aria-label="فتح القائمة"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div>
            <p className="text-xs font-medium text-slate-400">
              {roleLabel}
            </p>

            <h1 className="mt-0.5 text-lg font-black text-slate-900">
              أهلاً {name} 👋
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/business/create"
            className="hidden items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-200 transition hover:bg-sky-600 sm:flex"
          >
            <Plus className="h-4 w-4" />
            إضافة نشاط
          </Link>

          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600"
            aria-label="الإشعارات"
          >
            <Bell className="h-5 w-5" />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-sky-500 ring-2 ring-white" />
          </button>
        </div>
      </div>
    </header>
  );
}
