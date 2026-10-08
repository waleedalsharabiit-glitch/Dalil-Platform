
import Link from "next/link";
import {
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500 text-xl font-bold text-white">
                د
              </div>

              <span className="text-xl font-bold text-slate-900">
                دليل
              </span>
            </Link>

            <p className="mt-4 max-w-md text-sm leading-7 text-slate-500">
              منصة تساعدك على اكتشاف أفضل الخدمات والأماكن المحلية
              من حولك، ومعرفة تفاصيلها والتواصل معها بسهولة.
            </p>

            {/* Social */}
            <div className="mt-5 flex gap-2">
              {/* Facebook */}
              <a
                href="#"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition hover:bg-sky-50 hover:text-sky-600"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M14 8h3V4h-3c-3.31 0-5 1.69-5 5v3H6v4h3v8h4v-8h3l1-4h-4V9c0-.67.33-1 1-1Z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="#"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition hover:bg-sky-50 hover:text-sky-600"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="5"
                  />
                  <circle cx="12" cy="12" r="4" />
                  <circle
                    cx="17.5"
                    cy="6.5"
                    r="0.75"
                    fill="currentColor"
                    stroke="none"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-bold text-slate-900">
              روابط سريعة
            </h3>

            <div className="mt-4 space-y-3 text-sm">
              <Link
                href="/"
                className="block text-slate-500 transition hover:text-sky-600"
              >
                الرئيسية
              </Link>

              <Link
                href="/categories"
                className="block text-slate-500 transition hover:text-sky-600"
              >
                التصنيفات
              </Link>

              <Link
                href="/businesses"
                className="block text-slate-500 transition hover:text-sky-600"
              >
                اكتشف الأماكن
              </Link>

              <Link
                href="/business/create"
                className="block text-slate-500 transition hover:text-sky-600"
              >
                أضف نشاطك
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-slate-900">
              تواصل معنا
            </h3>

            <div className="mt-4 space-y-4 text-sm text-slate-500">
              <div className="flex items-center gap-2.5">
                <MapPin
                  size={17}
                  className="shrink-0 text-sky-500"
                />
                تعز 
              </div>

              <div className="flex items-center gap-2.5">
                <Phone
                  size={17}
                  className="shrink-0 text-sky-500"
                />
                <span dir="ltr">+967 734705920</span>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail
                  size={17}
                  className="shrink-0 text-sky-500"
                />
                waleed.alsharabi.it@gmail.com
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} دليل — جميع الحقوق محفوظة
        </div>
      </div>
    </footer>
  );
}
