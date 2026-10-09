"use client";

import Link from "next/link";
import {
  useCallback,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Compass,
  LocateFixed,
  LoaderCircle,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  X,
} from "lucide-react";

type SearchBusiness = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  isVerified: boolean;
  image: string | null;
  categories: { name: string; slug: string }[];
  services: { name: string; slug: string }[];
  location: {
    address: string | null;
    city: string | null;
    district: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  distanceKm: number | null;
  averageRating: number | null;
  reviewCount: number;
};

type SearchResponse = {
  success: boolean;
  message?: string;
  total: number;
  businesses: SearchBusiness[];
  interpretation: {
    categoryKeywords: string[];
    location: string | null;
    wantsNearby: boolean;
    searchTerms: string[];
    hasCoordinates: boolean;
    radiusKm: number;
  };
};

const SUGGESTIONS = [
  {
    label: "مطعم قريب مني",
    icon: "🍽️",
  },
  {
    label: "محل كمبيوتر في المعلا",
    icon: "💻",
  },
  {
    label: "صيدلية قريبة",
    icon: "💊",
  },
  {
    label: "محل يبيع SSD 1TB",
    icon: "💾",
  },
  {
    label: "محل شبكات وميكروتك",
    icon: "📡",
  },
  {
    label: "صيانة جوالات",
    icon: "📱",
  },
];

function getMapsUrl(business: SearchBusiness) {
  const location = business.location;

  if (
    location?.latitude != null &&
    location.longitude != null
  ) {
    return `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
  }

  const query = [
    business.name,
    location?.district,
    location?.city,
    location?.address,
  ]
    .filter(Boolean)
    .join(" ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export default function SmartSearch() {
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState("25");
  const [results, setResults] = useState<SearchBusiness[]>([]);
  const [interpretation, setInterpretation] =
    useState<SearchResponse["interpretation"] | null>(null);

  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] =
    useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [locationMessage, setLocationMessage] =
    useState("");

  const requestLocation = useCallback(
    () =>
      new Promise<{ lat: number; lng: number }>(
        (resolve, reject) => {
          if (!navigator.geolocation) {
            reject(
              new Error(
                "المتصفح لا يدعم تحديد الموقع الجغرافي.",
              ),
            );
            return;
          }

          setLocationLoading(true);
          setLocationMessage("");

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const nextCoordinates = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };

              setCoordinates(nextCoordinates);
              setLocationLoading(false);
              setLocationMessage(
                "تم تحديد موقعك بنجاح.",
              );

              resolve(nextCoordinates);
            },
            () => {
              setLocationLoading(false);
              reject(
                new Error(
                  "تعذر تحديد موقعك. اسمح للمتصفح بالوصول إلى الموقع أو ابحث باسم المنطقة.",
                ),
              );
            },
            {
              enableHighAccuracy: true,
              timeout: 12000,
              maximumAge: 60000,
            },
          );
        },
      ),
    [],
  );

  const executeSearch = useCallback(
    async (
      searchQuery: string,
      userCoordinates?: {
        lat: number;
        lng: number;
      } | null,
    ) => {
      setLoading(true);
      setError("");
      setHasSearched(true);

      try {
        const params = new URLSearchParams({
          q: searchQuery,
          radius,
        });

        if (userCoordinates) {
          params.set("lat", String(userCoordinates.lat));
          params.set("lng", String(userCoordinates.lng));
        }

        const response = await fetch(
          `/api/search/smart?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as SearchResponse;

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ?? "تعذر تنفيذ البحث.",
          );
        }

        setResults(data.businesses);
        setInterpretation(data.interpretation);
      } catch (searchError) {
        setResults([]);
        setInterpretation(null);

        setError(
          searchError instanceof Error
            ? searchError.message
            : "حدث خطأ غير متوقع.",
        );
      } finally {
        setLoading(false);
      }
    },
    [radius],
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const value = query.trim();

    if (!value) {
      setError("اكتب ما تبحث عنه أولًا.");
      return;
    }

    const wantsNearby =
      /قريب مني|قريبة مني|بالقرب مني|قريب|قريبة|حول موقعي/i.test(
        value,
      );

    let currentCoordinates = coordinates;

    if (wantsNearby && !currentCoordinates) {
      try {
        currentCoordinates = await requestLocation();
      } catch (locationError) {
        setError(
          locationError instanceof Error
            ? locationError.message
            : "تعذر تحديد موقعك.",
        );
        return;
      }
    }

    await executeSearch(value, currentCoordinates);
  }

  async function handleLocate() {
    try {
      const nextCoordinates = await requestLocation();

      if (query.trim()) {
        await executeSearch(
          query.trim(),
          nextCoordinates,
        );
      }
    } catch (locationError) {
      setError(
        locationError instanceof Error
          ? locationError.message
          : "تعذر تحديد موقعك.",
      );
    }
  }

  function chooseSuggestion(value: string) {
    setQuery(value);
    setError("");
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-hidden bg-slate-50"
    >
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-sky-600 via-sky-500 to-cyan-400">
        <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-36 -left-20 h-96 w-96 rounded-full bg-cyan-200/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-xs font-bold text-white shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              البحث الذكي في دليل
            </div>

            <h1 className="mt-6 text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              ماذا تبحث عنه
              <br />
              <span className="text-sky-100">
                بالقرب منك؟
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-sky-50 sm:text-base">
              اكتب طلبك بلغتك الطبيعية، وسنبحث عن الأنشطة
              والخدمات المطابقة في دليل.
            </p>
          </div>

          {/* Search form */}
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-9 max-w-4xl"
          >
            <div className="rounded-[28px] border border-white/50 bg-white p-2 shadow-2xl shadow-sky-950/20 sm:p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                    <Search className="h-6 w-6" />
                  </div>

                  <input
                    value={query}
                    onChange={(event) =>
                      setQuery(event.target.value)
                    }
                    placeholder="مثال: محل كمبيوتر في المعلا..."
                    aria-label="اكتب طلب البحث"
                    className="h-14 min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-400 sm:text-base"
                  />

                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setResults([]);
                        setHasSearched(false);
                        setError("");
                      }}
                      aria-label="مسح البحث"
                      className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || locationLoading}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-sky-500 px-7 font-bold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-36"
                >
                  {loading || locationLoading ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}

                  ابحث الآن
                </button>
              </div>

              <div className="mt-2 flex flex-col gap-3 border-t border-slate-100 px-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleLocate}
                  disabled={locationLoading}
                  className="inline-flex items-center gap-2 self-start rounded-xl px-2 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-50 disabled:opacity-60"
                >
                  <LocateFixed className="h-4 w-4" />

                  {locationLoading
                    ? "جارٍ تحديد موقعك..."
                    : coordinates
                      ? "تم تحديد موقعي"
                      : "استخدام موقعي الحالي"}
                </button>

                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap text-xs text-slate-500">
                    نطاق البحث
                  </span>

                  <select
                    value={radius}
                    onChange={(event) =>
                      setRadius(event.target.value)
                    }
                    aria-label="نطاق البحث بالكيلومترات"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-sky-400"
                  >
                    <option value="5">5 كم</option>
                    <option value="10">10 كم</option>
                    <option value="25">25 كم</option>
                    <option value="50">50 كم</option>
                    <option value="100">100 كم</option>
                  </select>
                </div>
              </div>
            </div>
          </form>

          {locationMessage && (
            <p className="mx-auto mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-white">
              <CheckCircle2 className="h-4 w-4" />
              {locationMessage}
            </p>
          )}
        </div>
      </section>

      {/* Suggestions */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 sm:text-xl">
              ابدأ ببحث سريع
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              اختر مثالًا أو اكتب طلبك بطريقتك.
            </p>
          </div>

          <div className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 sm:mt-0">
            <ShieldCheck className="h-4 w-4 text-sky-500" />
            البحث في الأنشطة النشطة فقط
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {SUGGESTIONS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() =>
                chooseSuggestion(item.label)
              }
              className="group flex min-h-28 flex-col items-start justify-between rounded-2xl border border-slate-200 bg-white p-4 text-right shadow-sm transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-100/70"
            >
              <span className="text-2xl">
                {item.icon}
              </span>

              <span className="mt-3 text-sm font-bold leading-6 text-slate-700 transition group-hover:text-sky-700">
                {item.label}
              </span>

              <ArrowLeft className="mt-2 h-4 w-4 text-slate-300 transition group-hover:-translate-x-1 group-hover:text-sky-500" />
            </button>
          ))}
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {hasSearched
                ? "نتائج البحث"
                : "اكتشف الأنشطة والخدمات"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {hasSearched
                ? `${results.length} نتيجة مطابقة`
                : "نتائج البحث ستظهر هنا بعد إدخال طلبك."}
            </p>
          </div>

          {hasSearched && results.length > 0 && (
            <Link
              href="/businesses/map"
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-sky-200 bg-white px-4 py-2.5 text-sm font-bold text-sky-700 transition hover:bg-sky-50 sm:self-auto"
            >
              <Compass className="h-4 w-4" />
              فتح الخريطة
            </Link>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700"
          >
            <X className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {interpretation && (
          <div className="mb-5 rounded-2xl border border-sky-100 bg-sky-50/80 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-sky-900">
              <Sparkles className="h-4 w-4" />
              فهم البحث
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {interpretation.categoryKeywords.length > 0 && (
                <span className="rounded-full border border-sky-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                  نوع النشاط:{" "}
                  {interpretation.categoryKeywords
                    .slice(0, 3)
                    .join("، ")}
                </span>
              )}

              {interpretation.location && (
                <span className="rounded-full border border-sky-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                  المنطقة: {interpretation.location}
                </span>
              )}

              {interpretation.wantsNearby && (
                <span className="rounded-full border border-sky-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <Navigation className="ml-1 inline h-3.5 w-3.5 text-sky-600" />
                  البحث عن القريب
                </span>
              )}

              {interpretation.searchTerms.map((term) => (
                <span
                  key={term}
                  className="rounded-full border border-sky-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  كلمة: {term}
                </span>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse overflow-hidden rounded-3xl border border-slate-200 bg-white p-4"
              >
                <div className="h-44 rounded-2xl bg-slate-100" />
                <div className="mt-4 h-5 w-2/3 rounded bg-slate-100" />
                <div className="mt-3 h-4 w-full rounded bg-slate-100" />
                <div className="mt-5 h-10 rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((business) => {
              const address = [
                business.location?.district,
                business.location?.city,
                business.location?.address,
              ]
                .filter(Boolean)
                .join("، ");

              return (
                <article
                  key={business.id}
                  className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-100/60"
                >
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-sky-100 to-slate-100">
                    {business.image ? (
                      <img
                        src={business.image}
                        alt={business.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Store className="h-14 w-14 text-sky-300" />
                      </div>
                    )}

                    <div className="absolute right-3 top-3 flex flex-wrap gap-2">
                      {business.isVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/95 px-2.5 py-1.5 text-[11px] font-bold text-sky-700 shadow-sm">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          نشاط موثّق
                        </span>
                      )}
                    </div>

                    {business.distanceKm !== null && (
                      <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-xl border border-white/70 bg-white/95 px-3 py-2 text-xs font-black text-slate-700 shadow-sm">
                        <Navigation className="h-3.5 w-3.5 text-sky-600" />
                        {business.distanceKm < 1
                          ? `${Math.round(
                              business.distanceKm * 1000,
                            )} متر`
                          : `${business.distanceKm} كم`}
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="line-clamp-1 text-lg font-black text-slate-900 transition group-hover:text-sky-700">
                          {business.name}
                        </h3>

                        {business.categories.length > 0 && (
                          <p className="mt-1 text-xs font-semibold text-sky-600">
                            {business.categories
                              .map((category) => category.name)
                              .join(" • ")}
                          </p>
                        )}
                      </div>

                      {business.averageRating !== null && (
                        <div className="flex shrink-0 items-center gap-1 rounded-xl bg-amber-50 px-2 py-1.5 text-xs font-black text-amber-700">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {business.averageRating}
                        </div>
                      )}
                    </div>

                    {business.description && (
                      <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-6 text-slate-500">
                        {business.description}
                      </p>
                    )}

                    <div className="mt-4 space-y-2">
                      {address ? (
                        <div className="flex items-start gap-2 text-xs leading-5 text-slate-500">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                          <span className="line-clamp-2">
                            {address}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <MapPin className="h-4 w-4" />
                          لم يحدد العنوان
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Star className="h-4 w-4 text-amber-400" />
                        {business.reviewCount > 0
                          ? `${business.reviewCount} تقييم`
                          : "لا توجد تقييمات بعد"}
                      </div>

                      {business.services.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {business.services
                            .slice(0, 3)
                            .map((service) => (
                              <span
                                key={service.slug}
                                className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600"
                              >
                                {service.name}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                      <Link
                        href={`/businesses/${business.slug}`}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-sky-600"
                      >
                        عرض النشاط
                        <ArrowLeft className="h-4 w-4" />
                      </Link>

                      <a
                        href={getMapsUrl(business)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                      >
                        <MapPin className="h-4 w-4" />
                        الاتجاهات
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : hasSearched && !error ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
              <Search className="h-7 w-7" />
            </div>

            <h3 className="mt-5 text-lg font-black text-slate-900">
              لم نعثر على نتائج مطابقة
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-slate-500">
              جرّب كلمات أخرى أو اسم منطقة مختلفًا، وتأكد أن
              الأنشطة المطلوبة مسجلة ومفعّلة في دليل.
            </p>

            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setInterpretation(null);
                setHasSearched(false);
                setError("");
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-600"
            >
              <Search className="h-4 w-4" />
              بحث جديد
            </button>
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    اكتب طلبك
                  </h3>
                  <p className="mt-1 text-xs leading-6 text-slate-500">
                    ابحث باسم النشاط أو الخدمة أو المنتج.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    حدد المنطقة
                  </h3>
                  <p className="mt-1 text-xs leading-6 text-slate-500">
                    اكتب اسم الحي أو اسم المدينة.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    قارن النتائج
                  </h3>
                  <p className="mt-1 text-xs leading-6 text-slate-500">
                    راجع العناوين والتقييمات والمسافات المتاحة.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}