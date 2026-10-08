
import Link from "next/link";
import {
  Bell,
  ChevronLeft,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export default function SettingsPage() {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f0f9ff] px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-5xl">
        <header className="mb-7">
          <p className="text-xs font-black tracking-[0.2em] text-sky-600">
            SETTINGS
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900">
            الإعدادات
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            إدارة حسابك وتفضيلاتك من مكان واحد.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsCard
            href="/dashboard/profile"
            icon={<UserRound className="h-5 w-5" />}
            title="الملف الشخصي"
            description="الاسم ورقم الهاتف ومعلومات الحساب"
          />

          <SettingsCard
            href="/dashboard/notifications"
            icon={<Bell className="h-5 w-5" />}
            title="الإشعارات"
            description="تابع طلباتك وآخر التحديثات"
          />

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <h2 className="mt-5 font-black text-slate-900">
              أمان الحساب
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              جلسة الدخول والصلاحيات تتم إدارتها بواسطة نظام المصادقة
              المركزي للمنصة.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <LockKeyhole className="h-5 w-5" />
            </div>

            <h2 className="mt-5 font-black text-slate-900">
              كلمة المرور
            </h2>

            <p className="mt-2 text-sm leading-7 text-slate-500">
              إدارة كلمة المرور تتم من خلال نظام تسجيل الدخول الحالي.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function SettingsCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-100/60"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 transition group-hover:bg-sky-500 group-hover:text-white">
          {icon}
        </div>

        <ChevronLeft className="h-5 w-5 text-slate-300 transition group-hover:-translate-x-1 group-hover:text-sky-500" />
      </div>

      <h2 className="mt-5 font-black text-slate-900">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-7 text-slate-500">
        {description}
      </p>
    </Link>
  );
}