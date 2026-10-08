"use client";

import { useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
interface ProfileFormProps {
  initialUser: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    image: string | null;
    role: string;
    isActive: boolean;
  };
}
const roleLabels: Record<string, string> = {
  USER: "مستخدم",
  BUSINESS_OWNER: "صاحب نشاط",
  ADMIN: "مدير",
  SUPER_ADMIN: "مدير عام",
};

export default function ProfileForm({
  initialUser,
}: ProfileFormProps) {
  const [name, setName] = useState(initialUser.name ?? "");
  const [phone, setPhone] = useState(initialUser.phone ?? "");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ?? "تعذر تحديث بيانات الحساب.",
        );
      }

      setMessage(
        data.message ?? "تم تحديث بيانات الحساب بنجاح.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء التحديث.",
      );
    } finally {
      setLoading(false);
    }
  }

  const initials =
    name.trim().charAt(0).toUpperCase() || "م";

  return (
    <div dir="rtl" className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-l from-sky-600 via-sky-500 to-cyan-500 p-6 text-white shadow-xl shadow-sky-200 sm:p-8">
        <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-10 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.5rem] bg-white/15 text-2xl font-black ring-1 ring-white/20 backdrop-blur">
              {initials}
            </div>

            <div>
              <p className="text-sm font-bold text-sky-100">
                حسابك الشخصي
              </p>

              <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                {name || "مستخدم"}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {roleLabels[initialUser.role] ??
                    initialUser.role}
                </span>

                {initialUser.isActive && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-50">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    الحساب نشط
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <ShieldCheck className="h-6 w-6 text-white" />

            <p className="mt-2 text-xs font-bold text-sky-100">
              حساب آمن
            </p>

            <p className="mt-1 text-[11px] leading-5 text-white/70">
              بيانات الحساب محمية ولا يمكن تغيير البريد من هذه الصفحة.
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
              <UserRound className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-black text-slate-900">
                المعلومات الشخصية
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                حدّث معلوماتك الأساسية من هنا.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6 sm:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                الاسم
              </span>

              <div className="relative">
                <UserRound className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  disabled={loading}
                  className="h-13 w-full rounded-2xl border border-slate-200 bg-white px-11 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:bg-slate-50"
                  placeholder="اسمك الكامل"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                رقم الهاتف
              </span>

              <div className="relative">
                <Phone className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  disabled={loading}
                  dir="ltr"
                  className="h-13 w-full rounded-2xl border border-slate-200 bg-white px-11 text-left text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:bg-slate-50"
                  placeholder="+967..."
                />
              </div>
            </label>

            <div className="block md:col-span-2">
              <span className="mb-2 block text-sm font-bold text-slate-700">
                البريد الإلكتروني
              </span>

              <div className="relative">
                <Mail className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <div className="flex h-13 items-center rounded-2xl border border-slate-200 bg-slate-50 px-11 text-sm font-semibold text-slate-500">
                  {initialUser.email}
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-400">
                البريد الإلكتروني مرتبط بحساب تسجيل الدخول.
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          {message && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {message}
            </div>
          )}

          <div className="flex justify-start">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-w-44 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-sky-600 to-cyan-500 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 hover:from-sky-700 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}