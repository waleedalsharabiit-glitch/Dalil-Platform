
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  ChevronLeft,
  ClipboardList,
  Heart,
  LayoutDashboard,
  MessageSquare,
  MessageSquareText,
  Plus,
  Settings,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";

import type { UserRole } from "@/generated/prisma/client";

interface DashboardSidebarProps {
  role: UserRole;
}

interface SidebarLinkProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active = false,
}: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-2.5 text-sm transition-all duration-300 ${
        active
          ? "bg-gradient-to-l from-sky-600 via-sky-500 to-cyan-400 font-bold text-white shadow-lg shadow-sky-200/80"
          : "font-semibold text-slate-600 hover:-translate-x-0.5 hover:bg-sky-50 hover:text-sky-600"
      }`}
    >
      {active && (
        <span className="absolute right-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-l-full bg-white" />
      )}

      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
          active
            ? "bg-white/15 text-white"
            : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-sky-500 group-hover:shadow-sm"
        }`}
      >
        <Icon className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110" />
      </span>

      <span className="flex-1">{label}</span>

      <ChevronLeft
        className={`h-4 w-4 transition-all duration-300 ${
          active
            ? "opacity-80"
            : "translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-50"
        }`}
      />
    </Link>
  );
}

export default function DashboardSidebar({
  role,
}: DashboardSidebarProps) {
  const isBusinessOwner = role === "BUSINESS_OWNER";
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  return (
    <aside className="relative hidden w-[292px] shrink-0 lg:block">
      <div className="sticky top-0 h-screen overflow-hidden bg-white">
        <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-sky-100 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-28 h-80 w-80 rounded-full bg-cyan-100/70 blur-3xl" />

        <div className="relative flex h-full flex-col border-l border-sky-100">
          {/* Brand */}
          <div className="p-5">
            <Link
              href="/"
              className="group relative block overflow-hidden rounded-[26px] bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-400 p-5 text-white shadow-xl shadow-sky-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-200"
            >
              <div className="absolute -left-8 -top-10 h-32 w-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-14 right-10 h-32 w-32 rounded-full bg-white/10" />

              <div className="relative flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl font-black text-sky-600 shadow-lg transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105">
                  د
                </div>

                <div>
                  <div className="text-xl font-black">دليل</div>

                  <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-sky-50">
                    <Sparkles className="h-3.5 w-3.5" />
                    لوحة التحكم الذكية
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="relative flex-1 overflow-y-auto px-4 pb-4">
            <div className="mb-2 px-2 text-[10px] font-black tracking-[0.18em] text-slate-400">
              الرئيسية
            </div>

            <SidebarLink
              href="/dashboard"
              icon={LayoutDashboard}
              label="لوحة التحكم"
              active
            />

            {isBusinessOwner && (
              <div className="mt-7">
                <div className="mb-3 flex items-center gap-2 px-2">
                  <span className="h-px flex-1 bg-slate-100" />
                  <span className="text-[10px] font-black tracking-[0.12em] text-slate-400">
                    إدارة النشاط
                  </span>
                  <span className="h-px flex-1 bg-slate-100" />
                </div>

                <div className="space-y-1">
                  <SidebarLink
                    href="/dashboard/businesses"
                    icon={Building2}
                    label="أنشطتي"
                  />

                  <SidebarLink
                    href="/dashboard/businesses/create"
                    icon={Plus}
                    label="إضافة نشاط"
                  />

                  <SidebarLink
                    href="/dashboard/offers"
                    icon={Sparkles}
                    label="العروض"
                  />

                  <SidebarLink
                    href="/dashboard/requests"
                    icon={MessageSquareText}
                    label="طلبات الخدمات"
                  />

                  <SidebarLink
                    href="/dashboard/reviews"
                    icon={Star}
                    label="التقييمات"
                  />

                  <SidebarLink
                    href="/dashboard/requests"
                    icon={ClipboardList}
                    label="الطلبات"
                  />
                </div>
              </div>
            )}

            <div className="mt-7">
              <div className="mb-3 flex items-center gap-2 px-2">
                <span className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-black tracking-[0.12em] text-slate-400">
                  حسابي
                </span>
                <span className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="space-y-1">
                <SidebarLink
                  href="/favorites"
                  icon={Heart}
                  label="المفضلة"
                />

                <SidebarLink
                  href="/reviews"
                  icon={MessageSquare}
                  label="مراجعاتي"
                />

                <SidebarLink
                  href="/requests"
                  icon={ClipboardList}
                  label="طلباتي"
                />

                <SidebarLink
                  href="/profile"
                  icon={UserRound}
                  label="الملف الشخصي"
                />
 
{isAdmin && (
  <>
    <SidebarLink href="/admin/categories" icon={Settings} label="إدارة التصنيفات" />
    <SidebarLink href="/admin/services" icon={ClipboardList} label="إدارة الخدمات" />
    <SidebarLink href="/admin/users" icon={UserRound} label="إدارة المستخدمين" />
    <SidebarLink href="/admin/businesses" icon={Building2} label="إدارة الأنشطة" />
    <SidebarLink href="/admin/reports" icon={MessageSquare} label="البلاغات" />

  </>
)}



                <SidebarLink
                  href="/dashboard"
                  icon={Settings}
                  label="الإعدادات"
                />
              </div>
            </div>
          </nav>

          {/* Bottom */}
          <div className="p-4">
            <div className="rounded-3xl bg-gradient-to-br from-sky-50 to-cyan-50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sky-500 shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-black text-slate-800">
                    استكشف دليل
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    اكتشف خدمات وأماكن جديدة
                  </p>
                </div>
              </div>

              <Link
                href="/"
                className="group flex items-center justify-between rounded-xl bg-white px-3 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition-all duration-300 hover:bg-sky-500 hover:text-white hover:shadow-lg hover:shadow-sky-200"
              >
                <span>العودة إلى المنصة</span>

                <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
