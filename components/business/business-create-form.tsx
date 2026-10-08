
"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
}

interface BusinessCreateFormProps {
  categories: Category[];
  services: Service[];
}

export default function BusinessCreateForm({
  categories,
  services,
}: BusinessCreateFormProps) {
  const router = useRouter();

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    [],
  );

  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function toggleCategory(id: string) {
    setSelectedCategories((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function toggleService(id: string) {
    setSelectedServices((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (selectedCategories.length === 0) {
      setError("اختر تصنيفًا واحدًا على الأقل.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const latitudeValue = String(formData.get("latitude") ?? "").trim();
    const longitudeValue = String(formData.get("longitude") ?? "").trim();

    const latitude = latitudeValue ? Number(latitudeValue) : null;
    const longitude = longitudeValue ? Number(longitudeValue) : null;

    if (
      (latitudeValue && Number.isNaN(latitude)) ||
      (longitudeValue && Number.isNaN(longitude))
    ) {
      setError("إحداثيات الموقع غير صحيحة.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/businesses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: String(formData.get("name") ?? ""),
          slug: String(formData.get("slug") ?? ""),
          description: String(formData.get("description") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          whatsapp: String(formData.get("whatsapp") ?? ""),
          website: String(formData.get("website") ?? ""),

          categoryIds: selectedCategories,
          serviceIds: selectedServices,

          address: String(formData.get("address") ?? ""),
          city: String(formData.get("city") ?? ""),
          district: String(formData.get("district") ?? ""),

          latitude,
          longitude,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message ?? "تعذر إنشاء النشاط.");
        return;
      }

      if (!result.success || !result.business?.slug) {
        setError("تم إنشاء النشاط، لكن تعذر الحصول على بياناته.");
        return;
      }

      setSuccess(
        result.message ??
          "تم إرسال النشاط التجاري بنجاح، وسيتم مراجعته قبل نشره.",
      );

      // إعادة ضبط النموذج مباشرة باستخدام المرجع المحفوظ.
      form.reset();

      setSelectedCategories([]);
      setSelectedServices([]);

      /*
       * النشاط أُنشئ بنجاح.
       * ننتقل إلى صفحة تفاصيله بعد بناء الصفحة.
       */
      window.setTimeout(() => {
        router.push(`/dashboard/businesses/${result.business.id}/images`);
      }, 1200);
    } catch (error) {
      console.error("Business creation request failed:", error);

      setError(
        "حدث خطأ غير متوقع أثناء معالجة الطلب. تحقق من الخادم ثم حاول مرة أخرى.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-7 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-7 text-emerald-700">
          {success}
        </div>
      )}

      <section className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-cyan-50 p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white shadow-sm">
            <Check className="h-4 w-4" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              إدارة الصور
            </h2>

            <p className="mt-1 text-sm leading-7 text-slate-600">
              بعد إنشاء النشاط ستنتقل مباشرة إلى صفحة إدارة الصور لرفع صور النشاط وتحديد الصورة الرئيسية.
            </p>
          </div>
        </div>
      </section>

      {/* Basic Information */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-bold text-slate-900">
          المعلومات الأساسية
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          أدخل المعلومات الرئيسية التي ستظهر للزوار.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              اسم النشاط *
            </label>

            <input
              required
              name="name"
              placeholder="مثال: مركز التقنية الحديثة"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              الرابط المختصر *
            </label>

            <input
              required
              name="slug"
              dir="ltr"
              placeholder="modern-tech-center"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-left text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />

            <p className="mt-2 text-xs text-slate-400">
              أحرف إنجليزية صغيرة وأرقام وشرطات فقط.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              رقم الهاتف
            </label>

            <input
              name="phone"
              type="tel"
              dir="ltr"
              placeholder="+967..."
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-left text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              WhatsApp
            </label>

            <input
              name="whatsapp"
              type="tel"
              dir="ltr"
              placeholder="+967..."
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-left text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              الموقع الإلكتروني
            </label>

            <input
              name="website"
              type="url"
              dir="ltr"
              placeholder="https://example.com"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-left text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              وصف النشاط
            </label>

            <textarea
              name="description"
              rows={5}
              placeholder="اكتب وصفًا واضحًا عن النشاط والخدمات التي يقدمها..."
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm leading-7 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-bold text-slate-900">
          التصنيفات
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          اختر التصنيفات التي تصف نشاطك.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const selected = selectedCategories.includes(category.id);

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-right transition ${
                  selected
                    ? "border-sky-400 bg-sky-50 text-sky-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    selected
                      ? "border-sky-500 bg-sky-500 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {selected && <Check className="h-3.5 w-3.5" />}
                </span>

                <span className="text-sm font-semibold">
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Services */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-bold text-slate-900">
          الخدمات
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          اختر الخدمات التي يقدمها نشاطك.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const selected = selectedServices.includes(service.id);

            return (
              <button
                key={service.id}
                type="button"
                onClick={() => toggleService(service.id)}
                className={`rounded-xl border p-4 text-right transition ${
                  selected
                    ? "border-sky-400 bg-sky-50"
                    : "border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      selected
                        ? "border-sky-500 bg-sky-500 text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {selected && <Check className="h-3.5 w-3.5" />}
                  </span>

                  <span className="text-sm font-semibold text-slate-800">
                    {service.name}
                  </span>
                </div>

                <span className="mt-2 block pr-8 text-xs text-slate-400">
                  {service.categoryName}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Location */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-lg font-bold text-slate-900">
          الموقع
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          أضف معلومات الموقع ليسهل على المستخدمين العثور عليك.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              المدينة
            </label>

            <input
              name="city"
              placeholder="مثال: تعز"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              المنطقة / الحي
            </label>

            <input
              name="district"
              placeholder="مثال: شارع جمال"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              العنوان التفصيلي
            </label>

            <input
              name="address"
              placeholder="مثال: بجانب..."
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              خط العرض Latitude
            </label>

            <input
              name="latitude"
              type="number"
              step="any"
              dir="ltr"
              placeholder="13.5795"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-left text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              خط الطول Longitude
            </label>

            <input
              name="longitude"
              type="number"
              step="any"
              dir="ltr"
              placeholder="44.0209"
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-left text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </div>
        </div>
      </section>

      {/* Submit */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-slate-500">
          سيتم إرسال النشاط للمراجعة قبل ظهوره للمستخدمين.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-500 px-8 text-sm font-bold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري الإرسال...
            </>
          ) : (
            "إرسال النشاط للمراجعة"
          )}
        </button>
      </div>
    </form>
  );
}