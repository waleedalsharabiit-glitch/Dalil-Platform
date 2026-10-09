
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { auth, signOut } from "@/lib/auth/auth";
import {
  Heart,
  LogIn,
  Menu,
  Plus,
  UserCircle,
} from "lucide-react";

export default async function SiteHeader() {
  const session = await auth();

  async function handleSignOut() {
    "use server";

    await signOut({
      redirectTo: "/",
    });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="دليل"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-xl font-bold text-white shadow-md shadow-sky-500/20">
            د
          </div>

          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              دليل
            </span>
            <span className="mr-1 hidden text-[11px] text-slate-400 sm:inline">
              اكتشف ما حولك
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-sky-600 transition hover:bg-sky-50"
          >
            الرئيسية
          </Link>

          <Link
            href="/categories"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-sky-600"
          >
            التصنيفات
          </Link>

          <Link
            href="/businesses/map"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-sky-600"
          >
            اكتشف الأماكن
          </Link>
          <Link
  href="/search"
  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-sky-50 hover:text-sky-600"
>
  <Sparkles className="h-4 w-4" />
  البحث الذكي
</Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Link
                href="/favorites"
                className="hidden h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-50 hover:text-sky-600 sm:flex"
                title="المفضلة"
              >
                <Heart size={19} />
              </Link>

              <Link
                href="/business/create"
                className="hidden items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 lg:flex"
              >
                <Plus size={17} />
                أضف نشاطك
              </Link>

              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 transition hover:border-sky-200 hover:bg-sky-50"
              >
                <UserCircle
                  size={21}
                  className="text-sky-500"
                />

                <span className="hidden max-w-24 truncate text-sm font-semibold text-slate-700 sm:block">
                  {session.user.name || "حسابي"}
                </span>
              </Link>

              <form action={handleSignOut} className="hidden sm:block">
                <button
                  type="submit"
                  className="rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                >
                  خروج
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-sky-600 sm:flex"
              >
                <LogIn size={17} />
                تسجيل الدخول
              </Link>

              <Link
                href="/register"
                className="rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition hover:bg-sky-600"
              >
                إنشاء حساب
              </Link>
            </>
          )}

          {/* Mobile menu */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 md:hidden"
            aria-label="فتح القائمة"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

