
"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Edit3,
  Loader2,
  Plus,
  Power,
  Search,
  Trash2,
  X,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  isActive: boolean;
  category: Category;
  _count: {
    businesses: number;
    requests: number;
  };
}

interface Props {
  initialServices: Service[];
  categories: Category[];
}

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  categoryId: "",
};

export default function AdminServicesManager({
  initialServices,
  categories,
}: Props) {
  const [services, setServices] =
    useState<Service[]>(initialServices);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return services.filter((service) => {
      const matchesSearch =
        !query ||
        service.name.toLowerCase().includes(query) ||
        service.slug.toLowerCase().includes(query) ||
        service.category.name.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "ALL" ||
        service.categoryId === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [services, search, categoryFilter]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setIsActive(true);
    setShowForm(false);
  }

  function openCreate() {
    setMessage("");
    setError("");

    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id || "",
    });

    setEditingId(null);
    setIsActive(true);
    setShowForm(true);
  }

  function openEdit(service: Service) {
    setMessage("");
    setError("");

    setEditingId(service.id);

    setForm({
      name: service.name,
      slug: service.slug,
      description: service.description || "",
      categoryId: service.categoryId,
    });

    setIsActive(service.isActive);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.categoryId) {
      setError("يجب اختيار تصنيف للخدمة.");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const url = editingId
        ? `/api/admin/services/${editingId}`
        : "/api/admin/services";

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug || undefined,
          description: form.description || null,
          categoryId: form.categoryId,
          isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "حدث خطأ أثناء حفظ الخدمة.",
        );
      }

      if (editingId) {
        setServices((current) =>
          current.map((service) =>
            service.id === editingId
              ? data.service
              : service,
          ),
        );

        setMessage("تم تحديث الخدمة بنجاح.");
      } else {
        setServices((current) => [
          data.service,
          ...current,
        ]);

        setMessage("تم إنشاء الخدمة بنجاح.");
      }

      resetForm();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function toggleService(service: Service) {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/services/${service.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: service.name,
            slug: service.slug,
            description: service.description,
            categoryId: service.categoryId,
            isActive: !service.isActive,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "تعذر تغيير حالة الخدمة.",
        );
      }

      setServices((current) =>
        current.map((item) =>
          item.id === service.id
            ? data.service
            : item,
        ),
      );

      setMessage(
        data.service.isActive
          ? "تم تفعيل الخدمة."
          : "تم تعطيل الخدمة.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteService(service: Service) {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف الخدمة "${service.name}"؟`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(service.id);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/services/${service.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "تعذر حذف الخدمة.",
        );
      }

      setServices((current) =>
        current.filter(
          (item) => item.id !== service.id,
        ),
      );

      setMessage("تم حذف الخدمة بنجاح.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ غير متوقع.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {(message || error) && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-bold ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || message}
        </div>
      )}

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              الخدمات
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              كل خدمة مرتبطة بتصنيف واحد ويمكن تغيير التصنيف
              في أي وقت.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-sky-600 hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            إضافة خدمة
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_280px]">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="ابحث عن خدمة أو تصنيف..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pr-12 pl-4 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
              className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            >
              <option value="ALL">
                جميع التصنيفات
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </section>

      {showForm && (
        <section className="rounded-[2rem] border border-sky-100 bg-white p-6 shadow-lg shadow-sky-100 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {editingId
                  ? "تعديل الخدمة"
                  : "إضافة خدمة جديدة"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                اختر التصنيف الذي تنتمي إليه الخدمة.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 md:grid-cols-2"
          >
            <Field
              label="اسم الخدمة"
              value={form.name}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  name: value,
                }))
              }
              placeholder="مثال: صيانة شاشات الآيفون"
              required
            />

            <Field
              label="الرابط المختصر"
              value={form.slug}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  slug: value,
                }))
              }
              placeholder="اتركه فارغًا للتوليد تلقائيًا"
            />

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                التصنيف
              </label>

              <div className="relative">
                <select
                  required
                  value={form.categoryId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      categoryId: event.target.value,
                    }))
                  }
                  className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                >
                  <option value="">
                    اختر التصنيف
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-sky-50">
              <div>
                <p className="text-sm font-black text-slate-800">
                  الخدمة نشطة
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  ستظهر ضمن الخدمات المتاحة.
                </p>
              </div>

              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) =>
                  setIsActive(event.target.checked)
                }
                className="h-5 w-5 accent-sky-500"
              />
            </label>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                وصف الخدمة
              </label>

              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={4}
                placeholder="وصف مختصر للخدمة..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div className="flex gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-sky-200 transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Check className="h-5 w-5" />
                )}

                {editingId
                  ? "حفظ التعديلات"
                  : "إنشاء الخدمة"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                إلغاء
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px]">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-right text-xs font-black text-slate-500">
                <th className="px-6 py-4">
                  الخدمة
                </th>

                <th className="px-6 py-4">
                  التصنيف
                </th>

                <th className="px-6 py-4">
                  الأنشطة
                </th>

                <th className="px-6 py-4">
                  الطلبات
                </th>

                <th className="px-6 py-4">
                  الحالة
                </th>

                <th className="px-6 py-4">
                  الإجراءات
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredServices.map((service) => (
                <tr
                  key={service.id}
                  className="border-b border-slate-100 transition hover:bg-sky-50/50"
                >
                  <td className="px-6 py-5">
                    <div>
                      <p className="font-black text-slate-900">
                        {service.name}
                      </p>

                      <code className="mt-1 inline-block rounded-lg bg-slate-100 px-2 py-1 text-[11px] text-slate-500">
                        {service.slug}
                      </code>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <span className="inline-flex items-center rounded-xl bg-sky-50 px-3 py-2 text-xs font-black text-sky-700">
                      {service.category.name}
                    </span>
                  </td>

                  <td className="px-6 py-5 font-bold text-slate-700">
                    {service._count.businesses}
                  </td>

                  <td className="px-6 py-5 font-bold text-slate-700">
                    {service._count.requests}
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${
                        service.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          service.isActive
                            ? "bg-emerald-500"
                            : "bg-slate-400"
                        }`}
                      />

                      {service.isActive
                        ? "نشطة"
                        : "معطلة"}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openEdit(service)
                        }
                        title="تعديل"
                        className="rounded-xl p-2.5 text-sky-600 transition hover:bg-sky-100"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleService(service)
                        }
                        title={
                          service.isActive
                            ? "تعطيل"
                            : "تفعيل"
                        }
                        className={`rounded-xl p-2.5 transition ${
                          service.isActive
                            ? "text-amber-600 hover:bg-amber-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        <Power className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteService(service)
                        }
                        disabled={
                          deletingId === service.id
                        }
                        title="حذف"
                        className="rounded-xl p-2.5 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === service.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredServices.length === 0 && (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-50 text-2xl">
              🧩
            </div>

            <h3 className="font-black text-slate-800">
              لا توجد خدمات
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              أضف خدمة جديدة أو غيّر الفلاتر.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        value={value}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
      />
    </div>
  );
}
