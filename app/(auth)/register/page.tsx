
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Search,
  User,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError("");
    setSuccess("");

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const phone = String(formData.get("phone") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(
      formData.get("confirmPassword") ?? "",
    );

    if (!name || !email || !password || !confirmPassword) {
      setError("يرجى تعبئة جميع الحقول المطلوبة");
      setIsLoading(false);
      return;
    }

    if (name.length < 2) {
      setError("الاسم يجب أن يكون حرفين على الأقل");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "حدث خطأ أثناء إنشاء الحساب");
        setIsLoading(false);
        return;
      }

      setSuccess("تم إنشاء حسابك بنجاح، جاري تسجيل الدخول...");

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl:
          new URLSearchParams(window.location.search).get(
            "callbackUrl",
          ) || "/",
      });

      if (result?.error) {
        router.push("/login");
        return;
      }

      router.push(result?.url || "/");
    } catch {
      setError("تعذر الاتصال بالخادم، حاول مرة أخرى");
      setIsLoading(false);
    }
  }

  async function handleGoogleRegister() {
    setIsGoogleLoading(true);
    setError("");

    const callbackUrl =
      new URLSearchParams(window.location.search).get("callbackUrl") ||
      "/";

    await signIn("google", {
      callbackUrl,
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="w-full max-w-[460px]">
          {/* Brand */}
          <div className="mb-7 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-3"
              aria-label="دليل"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-2xl font-bold text-white shadow-lg shadow-sky-500/20">
                د
              </div>

              <span className="text-2xl font-bold tracking-tight text-slate-900">
                دليل
              </span>
            </Link>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
            {/* Header */}
            <div className="mb-7 text-center">
              <h1 className="text-2xl font-bold text-slate-900">
                إنشاء حساب جديد ✨
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                أنشئ حسابك واكتشف أفضل الخدمات والأماكن من حولك
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium leading-6 text-red-600"
              >
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div
                role="status"
                className="mb-5 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-600"
              >
                <Check size={17} />
                {success}
              </div>
            )}

            <form action={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  الاسم الكامل
                </label>

                <div className="relative">
                  <User
                    size={19}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="أدخل اسمك الكامل"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pr-11 pl-4 text-right text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  البريد الإلكتروني
                </label>

                <div className="relative">
                  <Mail
                    size={19}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="example@email.com"
                    dir="ltr"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pr-11 pl-4 text-left text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                  رقم الهاتف
                  <span className="font-normal text-slate-400">
                    (اختياري)
                  </span>
                </label>

                <div className="relative">
                  <Phone
                    size={19}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="77xxxxxxx"
                    dir="ltr"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pr-11 pl-4 text-left text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  كلمة المرور
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="8 أحرف على الأقل"
                    dir="ltr"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-11 text-left text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label={
                      showPassword
                        ? "إخفاء كلمة المرور"
                        : "إظهار كلمة المرور"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  تأكيد كلمة المرور
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={
                      showConfirmPassword ? "text" : "password"
                    }
                    autoComplete="new-password"
                    placeholder="أعد إدخال كلمة المرور"
                    dir="ltr"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-11 text-left text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((value) => !value)
                    }
                    className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label={
                      showConfirmPassword
                        ? "إخفاء تأكيد كلمة المرور"
                        : "إظهار تأكيد كلمة المرور"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <div className="pt-1">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 h-4 w-4 rounded border-slate-300 accent-sky-500"
                  />

                  <span className="text-xs leading-5 text-slate-500">
                    أوافق على شروط الاستخدام وسياسة الخصوصية الخاصة
                    بمنصة دليل.
                  </span>
                </label>
              </div>

              {/* Register */}
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    جاري إنشاء الحساب...
                  </>
                ) : (
                  "إنشاء الحساب"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />

              <span className="text-xs font-medium text-slate-400">
                أو
              </span>

              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={isLoading || isGoogleLoading}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
              ) : (
                <GoogleIcon />
              )}

              <span>
                {isGoogleLoading
                  ? "جاري المتابعة مع Google..."
                  : "التسجيل باستخدام Google"}
              </span>
            </button>

            {/* Login */}
            <div className="mt-7 border-t border-slate-100 pt-6 text-center">
              <p className="text-sm text-slate-500">
                لديك حساب بالفعل؟
                <Link
                  href="/login"
                  className="mr-1 font-bold text-sky-600 transition hover:text-sky-700"
                >
                  تسجيل الدخول
                </Link>
              </p>
            </div>
          </div>

          {/* Footer hints */}
          <div className="mt-6 flex items-center justify-center gap-5 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Search size={14} />
              ابحث بسهولة
            </span>

            <span className="h-1 w-1 rounded-full bg-slate-300" />

            <span className="flex items-center gap-1.5">
              <MapPin size={14} />
              اكتشف القريب منك
            </span>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} دليل — جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.26Z"
      />
      <path
        fill="#34A853"
        d="M12 21.74c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.74Z"
      />
      <path
        fill="#FBBC05"
        d="M6.54 13.82A5.86 5.86 0 0 1 6.23 12c0-.63.11-1.25.31-1.82V7.65H3.3A9.74 9.74 0 0 0 2.26 12c0 1.57.38 3.05 1.04 4.35l3.24-2.53Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.15c1.43 0 2.72.49 3.73 1.46l2.8-2.8C16.84 3.2 14.63 2.26 12 2.26a9.74 9.74 0 0 0-8.7 5.39l3.24 2.53C7.31 7.87 9.46 6.15 12 6.15Z"
      />
    </svg>
  );
}
