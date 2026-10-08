
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  Globe,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  Wrench,
} from "lucide-react";

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
  category: {
    id: string;
    name: string;
  };
}

interface BusinessEditFormProps {
  business: {
    id: string;
    name: string;
    description: string;
    phone: string;
    whatsapp: string;
    website: string;
    categoryIds: string[];
    serviceIds: string[];
    location: {
      address: string;
      city: string;
      district: string;
      latitude: number | null;
      longitude: number | null;
    };
  };
  categories: Category[];
  services: Service[];
}

interface FormState {
  name: string;
  description: string;
  phone: string;
  whatsapp: string;
  website: string;
  categoryIds: string[];
  serviceIds: string[];
  address: string;
  city: string;
  district: string;
  latitude: string;
  longitude: string;
}

export default function BusinessEditForm({
  business,
  categories,
  services,
}: BusinessEditFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: business.name,
    description: business.description,
    phone: business.phone,
    whatsapp: business.whatsapp,
    website: business.website,
    categoryIds: business.categoryIds,
    serviceIds: business.serviceIds,
    address: business.location.address,
    city: business.location.city,
    district: business.location.district,
    latitude:
      business.location.latitude != null
        ? String(business.location.latitude)
        : "",
    longitude:
      business.location.longitude != null
        ? String(business.location.longitude)
        : "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedServices = useMemo(() => {
    return services.filter((service) =>
      form.serviceIds.includes(service.id),
    );
  }, [services, form.serviceIds]);

  function updateField(
    field: keyof FormState,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleCategory(categoryId: string) {
    setForm((current) => {
      const exists = current.categoryIds.includes(categoryId);

      return {
        ...current,
        categoryIds: exists
          ? current.categoryIds.filter(
              (id) => id !== categoryId,
            )
          : [...current.categoryIds, categoryId],
      };
    });
  }

  function toggleService(serviceId: string) {
    setForm((current) => {
      const exists = current.serviceIds.includes(serviceId);

      return {
        ...current,
        serviceIds: exists
          ? current.serviceIds.filter(
              (id) => id !== serviceId,
            )
          : [...current.serviceIds, serviceId],
      };
    });
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setIsSaving(true);
    setMessage("");
    setError("");

    if (!form.name.trim()) {
      setError("اسم النشاط مطلوب.");
      setIsSaving(false);
      return;
    }

    if (form.categoryIds.length === 0) {
      setError("اختر تصنيفًا واحدًا على الأقل.");
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/businesses/${business.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim() || null,
            phone: form.phone.trim() || null,
            whatsapp: form.whatsapp.trim() || null,
            website: form.website.trim() || null,
            categoryIds: form.categoryIds,
            serviceIds: form.serviceIds,

            location: {
              address: form.address.trim() || null,
              city: form.city.trim() || null,
              district: form.district.trim() || null,
              latitude: form.latitude
                ? Number(form.latitude)
                : null,
              longitude: form.longitude
                ? Number(form.longitude)
                : null,
            },
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "حدث خطأ أثناء تحديث بيانات النشاط.",
        );
      }

      setMessage(
        "تم حفظ التعديلات بنجاح. سيتم تحديث حالة النشاط إذا كانت البيانات تحتاج إلى مراجعة.",
      );

      setTimeout(() => {
        router.push(`/dashboard/businesses/${business.id}`);
      }, 900);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ غير متوقع.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-bold">تعذر حفظ التعديلات</p>
            <p className="mt-1 leading-6">{error}</p>
          </div>
        </div>
      )}

      {message && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
          <Check className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-bold">تم الحفظ بنجاح</p>
            <p className="mt-1 leading-6">{message}</p>
          </div>
        </div>
      )}

      {/* Basic information */}
      <FormSection
        number="01"
        eyebrow="المعلومات الأساسية"
        title="بيانات النشاط"
        description="المعلومات الأساسية التي ستظهر للعملاء في صفحة نشاطك."
      >
        <div className="grid gap-5">
          <Field
            label="اسم النشاط"
            required
            value={form.name}
            onChange={(value) =>
              updateField("name", value)
            }
            placeholder="مثال: عالم الكمبيوتر"
          />

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              وصف النشاط
            </label>

            <textarea
              value={form.description}
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value,
                )
              }
              rows={5}
              placeholder="اكتب وصفًا مختصرًا وواضحًا عن نشاطك والخدمات التي تقدمها..."
              className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            />

            <p className="mt-2 text-xs text-slate-400">
              الوصف الجيد يساعد العملاء على فهم نشاطك بسرعة.
            </p>
          </div>
        </div>
      </FormSection>

      {/* Categories and services */}
      <FormSection
        number="02"
        eyebrow="التخصص"
        title="التصنيفات والخدمات"
        description="حدد المجالات والخدمات التي يقدمها نشاطك."
      >
        <div className="space-y-7">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700">
                التصنيفات
                <span className="mr-1 text-rose-500">*</span>
              </label>

              <span className="text-xs font-medium text-slate-400">
                {form.categoryIds.length} محدد
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const selected =
                  form.categoryIds.includes(category.id);

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      toggleCategory(category.id)
                    }
                    className={`group flex items-center justify-between rounded-2xl border p-4 text-right transition-all duration-200 ${
                      selected
                        ? "border-sky-300 bg-sky-50 text-sky-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50/50"
                    }`}
                  >
                    <span className="font-bold text-sm">
                      {category.name}
                    </span>

                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-lg border transition ${
                        selected
                          ? "border-sky-500 bg-sky-500 text-white"
                          : "border-slate-200 bg-slate-50 text-transparent group-hover:border-sky-200"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-7">
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700">
                الخدمات
              </label>

              <span className="text-xs font-medium text-slate-400">
                {form.serviceIds.length} محدد
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((service) => {
                const selected =
                  form.serviceIds.includes(service.id);

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() =>
                      toggleService(service.id)
                    }
                    className={`group flex items-center gap-3 rounded-2xl border p-4 text-right transition-all duration-200 ${
                      selected
                        ? "border-emerald-200 bg-emerald-50/70 shadow-sm"
                        : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50/50"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                        selected
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-50 text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-500"
                      }`}
                    >
                      <Wrench className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-700">
                        {service.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {service.category.name}
                      </p>
                    </div>

                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-lg border ${
                        selected
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-200 text-transparent"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedServices.length > 0 && (
              <p className="mt-3 text-xs text-slate-400">
                تم اختيار {selectedServices.length} خدمة.
              </p>
            )}
          </div>
        </div>
      </FormSection>

      {/* Media */}
      <FormSection
        number="03"
        eyebrow="الصور"
        title="معرض النشاط"
        description="يمكنك رفع الصور وتحديد الصورة الرئيسية من صفحة إدارة الصور الخاصة بالنشاط."
      >
        <div className="flex flex-col gap-4 rounded-2xl border border-sky-100 bg-sky-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-sky-800">
              أضف صور نشاطك الآن
            </p>

            <p className="mt-1 text-xs leading-6 text-sky-700/80">
              الصور تساعد العملاء على معرفة نشاطك بشكل أفضل، ويفضل أن تكون صورة رئيسية واضحة ومميزة.
            </p>
          </div>

          <Link
            href={`/dashboard/businesses/${business.id}/images`}
            className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700"
          >
            إدارة الصور
          </Link>
        </div>
      </FormSection>

      {/* Contact */}
      <FormSection
        number="04"
        eyebrow="التواصل"
        title="معلومات التواصل"
        description="طرق التواصل التي سيستخدمها العملاء للوصول إليك."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <InputWithIcon
            icon={<Phone className="h-4 w-4" />}
            label="رقم الهاتف"
            value={form.phone}
            onChange={(value) =>
              updateField("phone", value)
            }
            placeholder="مثال: 777123456"
            type="tel"
          />

          <InputWithIcon
            icon={<MessageCircle className="h-4 w-4" />}
            label="رقم WhatsApp"
            value={form.whatsapp}
            onChange={(value) =>
              updateField("whatsapp", value)
            }
            placeholder="مثال: +967777123456"
            type="tel"
          />

          <div className="sm:col-span-2">
            <InputWithIcon
              icon={<Globe className="h-4 w-4" />}
              label="الموقع الإلكتروني"
              value={form.website}
              onChange={(value) =>
                updateField("website", value)
              }
              placeholder="https://example.com"
              type="url"
            />
          </div>
        </div>
      </FormSection>

      {/* Location */}
      <FormSection
        number="05"
        eyebrow="الموقع"
        title="موقع النشاط"
        description="ساعد العملاء على الوصول إلى نشاطك بسهولة."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <InputWithIcon
              icon={<MapPin className="h-4 w-4" />}
              label="العنوان"
              value={form.address}
              onChange={(value) =>
                updateField("address", value)
              }
              placeholder="مثال: شارع جمال، بجانب..."
            />
          </div>

          <Field
            label="المدينة"
            value={form.city}
            onChange={(value) =>
              updateField("city", value)
            }
            placeholder="مثال: تعز"
          />

          <Field
            label="المنطقة / الحي"
            value={form.district}
            onChange={(value) =>
              updateField("district", value)
            }
            placeholder="مثال: الحوبان"
          />

          <Field
            label="خط العرض Latitude"
            value={form.latitude}
            onChange={(value) =>
              updateField("latitude", value)
            }
            placeholder="13.5795"
            type="number"
            step="any"
          />

          <Field
            label="خط الطول Longitude"
            value={form.longitude}
            onChange={(value) =>
              updateField("longitude", value)
            }
            placeholder="44.0209"
            type="number"
            step="any"
          />
        </div>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50 p-4">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />

          <div>
            <p className="text-sm font-bold text-sky-700">
              تحديد الموقع على الخريطة
            </p>

            <p className="mt-1 text-xs leading-6 text-sky-600/80">
              حاليًا يمكنك إدخال الإحداثيات يدويًا. سنضيف
              اختيار الموقع من الخريطة مباشرة في مرحلة الخرائط.
            </p>
          </div>
        </div>
      </FormSection>

      {/* Submit */}
      <div className="sticky bottom-4 z-20">
        <div className="flex flex-col gap-3 rounded-2xl border border-white/80 bg-white/95 p-3 shadow-2xl shadow-sky-200/40 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-slate-700">
              جاهز لحفظ التعديلات؟
            </p>

            <p className="mt-1 text-xs text-slate-400">
              تأكد من صحة المعلومات قبل الحفظ.
            </p>
          </div>

          <div className="flex w-full gap-3 sm:w-auto">
            <Link
              href={`/dashboard/businesses/${business.id}`}
              className="flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 sm:flex-none"
            >
              إلغاء
            </Link>

            <button
              type="submit"
              disabled={isSaving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-sky-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-200 transition-all hover:-translate-y-0.5 hover:from-sky-700 hover:to-cyan-600 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جارٍ الحفظ...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  حفظ التعديلات
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function FormSection({
  number,
  eyebrow,
  title,
  description,
  children,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-sky-100/40 sm:p-7">
      <div className="mb-7 flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-sm font-black text-white shadow-lg shadow-sky-200">
          {number}
        </div>

        <div>
          <p className="text-xs font-black text-sky-600">
            {eyebrow}
          </p>

          <h2 className="mt-1 text-xl font-black text-slate-950">
            {title}
          </h2>

          <p className="mt-1 text-xs leading-6 text-slate-400">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}

        {required && (
          <span className="mr-1 text-rose-500">*</span>
        )}
      </label>

      <input
        type={type}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
      />
    </div>
  );
}

function InputWithIcon({
  icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center text-sky-500">
          {icon}
        </div>

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-4 pr-11 text-sm text-slate-800 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
        />
      </div>
    </div>
  );
}
