"use client";

import { useMemo, useState } from "react";
import {
  Check,
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
  description: string | null;
  icon: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: {
    businesses: number;
    services: number;
  };
}

interface Props {
  initialCategories: Category[];
}

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  image: "",
};

export default function AdminCategoriesManager({
  initialCategories,
}: Props) {
  const [categories, setCategories] =
    useState<Category[]>(initialCategories);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return categories;
    }

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        category.slug.toLowerCase().includes(query),
    );
  }, [categories, search]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setIsActive(true);
    setShowForm(false);
  }

  function openCreate() {
    setMessage("");
    setError("");
    setForm(emptyForm);
    setEditingId(null);
    setIsActive(true);
    setShowForm(true);
  }

  function openEdit(category: Category) {
    setMessage("");
    setError("");

    setEditingId(category.id);

    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      icon: category.icon || "",
      image: category.image || "",
    });

    setIsActive(category.isActive);
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

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const url = editingId
        ? `/api/admin/categories/${editingId}`
        : "/api/admin/categories";

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug || undefined,
          description: form.description || null,
          icon: form.icon || null,
          image: form.image || null,
          isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "حدث خطأ أثناء حفظ التصنيف.",
        );
      }

      if (editingId) {
        setCategories((current) =>
          current.map((category) =>
            category.id === editingId
              ? {
                  ...category,
                  ...data.category,
                }
              : category,
          ),
        );

        setMessage("تم تحديث التصنيف بنجاح.");
      } else {
        setCategories((current) => [
          {
            ...data.category,
            _count: {
              businesses: 0,
              services: 0,
            },
          },
          ...current,
        ]);

        setMessage("تم إنشاء التصنيف بنجاح.");
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

  async function toggleCategory(category: Category) {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/categories/${category.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: category.name,
            slug: category.slug,
            description: category.description,
            icon: category.icon,
            image: category.image,
            isActive: !category.isActive,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "تعذر تغيير حالة التصنيف.",
        );
      }

      setCategories((current) =>
        current.map((item) =>
          item.id === category.id
            ? {
                ...item,
                isActive: data.category.isActive,
              }
            : item,
        ),
      );

      setMessage(
        data.category.isActive
          ? "تم تفعيل التصنيف."
          : "تم تعطيل التصنيف.",
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

  async function deleteCategory(category: Category) {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف التصنيف "${category.name}"؟`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(category.id);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/categories/${category.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "تعذر حذف التصنيف.",
        );
      }

      setCategories((current) =>
        current.filter((item) => item.id !== category.id),
      );

      setMessage("تم حذف التصنيف بنجاح.");
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              التصنيفات
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              إدارة التصنيفات التي تظهر في منصة دليل.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-sky-600 hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            إضافة تصنيف
          </button>
        </div>

        <div className="relative mt-6">
          <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="ابحث عن تصنيف..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pr-12 pl-4 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />
        </div>
      </section>

      {showForm && (
        <section className="rounded-[2rem] border border-sky-100 bg-white p-6 shadow-lg shadow-sky-100 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                {editingId
                  ? "تعديل التصنيف"
                  : "إضافة تصنيف جديد"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                البيانات ستُحفظ مباشرة في قاعدة البيانات.
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
              label="اسم التصنيف"
              value={form.name}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  name: value,
                }))
              }
              placeholder="مثال: صيانة الجوالات"
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

            <Field
              label="الأيقونة"
              value={form.icon}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  icon: value,
                }))
              }
              placeholder="مثال: Smartphone"
            />

            <Field
              label="رابط الصورة"
              value={form.image}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  image: value,
                }))
              }
              placeholder="https://example.com/category-image.jpg"
            />

            <div className="flex items-end">
              <label className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-200 hover:bg-sky-50">
                <div>
                  <p className="text-sm font-black text-slate-800">
                    التصنيف نشط
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    سيظهر للمستخدمين عند التفعيل.
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
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                معاينة الصورة
              </label>

              <div
                className="relative overflow-hidden rounded-[1.5rem] border border-sky-100 bg-slate-100"
                style={{
                  backgroundImage: form.image
                    ? `linear-gradient(135deg, rgba(14,165,233,0.22), rgba(15,23,42,0.2)), url(${form.image})`
                    : "linear-gradient(135deg, rgba(224,242,254,0.95), rgba(255,255,255,0.95))",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  minHeight: "180px",
                }}
              >
                <div className="flex min-h-[180px] items-end justify-between bg-gradient-to-t from-slate-900/50 via-slate-900/10 to-transparent p-4">
                  <div>
                    <p className="text-xs font-black text-white/80">معاينة</p>
                    <p className="text-lg font-black text-white">
                      {form.name || "اسم التصنيف"}
                    </p>
                  </div>

                  <div className="rounded-full border border-white/40 bg-white/20 px-3 py-1 text-[10px] font-black text-white backdrop-blur-sm">
                    {form.icon || "📁"}
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                الوصف
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
                placeholder="وصف مختصر للتصنيف..."
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
                  : "إنشاء التصنيف"}
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
          <table className="w-full min-w-[850px]">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-right text-xs font-black text-slate-500">
                <th className="px-6 py-4">التصنيف</th>
                <th className="px-6 py-4">الرابط</th>
                <th className="px-6 py-4">الأنشطة</th>
                <th className="px-6 py-4">الخدمات</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">الإجراءات</th>
              </tr>
            </thead>

            <tbody>
              {filteredCategories.map((category) => (
                <tr
                  key={category.id}
                  className="border-b border-slate-100 transition hover:bg-sky-50/50"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-sky-100 bg-slate-200 text-lg shadow-sm"
                        style={{
                          backgroundImage: category.image
                            ? `linear-gradient(135deg, rgba(14,165,233,0.18), rgba(15,23,42,0.18)), url(${category.image})`
                            : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        {!category.image && <span>{category.icon || "📂"}</span>}
                      </div>

                      <div>
                        <p className="font-black text-slate-900">
                          {category.name}
                        </p>

                        {category.description && (
                          <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <code className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      {category.slug}
                    </code>
                  </td>

                  <td className="px-6 py-5">
                    <span className="font-bold text-slate-700">
                      {category._count.businesses}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <span className="font-bold text-slate-700">
                      {category._count.services}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${
                        category.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          category.isActive
                            ? "bg-emerald-500"
                            : "bg-slate-400"
                        }`}
                      />

                      {category.isActive
                        ? "نشط"
                        : "معطل"}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(category)}
                        title="تعديل"
                        className="rounded-xl p-2.5 text-sky-600 transition hover:bg-sky-100 hover:text-sky-700"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleCategory(category)
                        }
                        title={
                          category.isActive
                            ? "تعطيل"
                            : "تفعيل"
                        }
                        className={`rounded-xl p-2.5 transition ${
                          category.isActive
                            ? "text-amber-600 hover:bg-amber-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        <Power className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteCategory(category)
                        }
                        disabled={deletingId === category.id}
                        title="حذف"
                        className="rounded-xl p-2.5 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === category.id ? (
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

        {filteredCategories.length === 0 && (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-50 text-2xl">
              🔎
            </div>

            <h3 className="font-black text-slate-800">
              لا توجد نتائج
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              جرّب البحث باسم تصنيف آخر.
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
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
      />
    </div>
  );
}