
"use client";

import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ImagePlus,
  Loader2,
  Pencil,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface BusinessImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

interface BusinessImagesManagerProps {
  businessId: string;
  businessName: string;
}

export default function BusinessImagesManager({
  businessId,
  businessName,
}: BusinessImagesManagerProps) {
  const [images, setImages] = useState<BusinessImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [url, setUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAltText, setEditingAltText] = useState("");

  const loadImages = useCallback(async () => {
    try {
      const response = await fetch(`/api/businesses/${businessId}/images`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "تعذر تحميل الصور");
      }

      setImages(data.images || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل الصور");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    let active = true;

    void fetch(`/api/businesses/${businessId}/images`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "تعذر تحميل الصور");
        }

        if (active) {
          setImages(data.images || []);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "تعذر تحميل الصور");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [businessId]);

  async function addImage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFiles.length && !url.trim()) {
      setError("اختر صورًا من الجهاز أو أدخل رابط صورة");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (selectedFiles.length > 0) {
        const formData = new FormData();

        selectedFiles.forEach((file) => {
          formData.append("files", file);
        });

        if (altText.trim()) {
          formData.set("altText", altText.trim());
        }

        formData.set("isPrimary", images.length === 0 ? "true" : "false");

        const response = await fetch(`/api/businesses/${businessId}/images`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "تعذر رفع الصور");
        }

        setImages((current) => [...current, ...(data.images || [])]);
        setSelectedFiles([]);
        setAltText("");
        setUrl("");

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        setMessage(
          data.images?.length > 1
            ? `تم رفع ${data.images.length} صور بنجاح`
            : "تمت إضافة الصورة بنجاح",
        );
        return;
      }

      const response = await fetch(`/api/businesses/${businessId}/images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          altText: altText.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "تعذر إضافة الصورة");
      }

      setImages((current) => [
        ...current,
        {
          ...data.image,
          createdAt: new Date(data.image.createdAt).toISOString(),
        },
      ]);

      setUrl("");
      setAltText("");
      setMessage("تمت إضافة الصورة بنجاح");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إضافة الصورة");
    } finally {
      setSaving(false);
    }
  }

  async function updateImage(
    imageId: string,
    payload: {
      altText?: string | null;
      isPrimary?: boolean;
      sortOrder?: number;
    },
  ) {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(`/api/businesses/${businessId}/images/${imageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "تعذر تحديث الصورة");
      }

      if (payload.isPrimary) {
        setImages((current) =>
          current.map((image) => ({
            ...image,
            isPrimary: image.id === imageId,
          })),
        );
      } else {
        setImages((current) =>
          current.map((image) =>
            image.id === imageId
              ? {
                  ...image,
                  ...data.image,
                }
              : image,
          ),
        );
      }

      setMessage("تم تحديث الصورة بنجاح");
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحديث الصورة");
    } finally {
      setSaving(false);
    }
  }

  async function deleteImage(imageId: string) {
    const confirmed = window.confirm("هل أنت متأكد من حذف هذه الصورة؟");

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(imageId);
      setError("");
      setMessage("");

      const response = await fetch(`/api/businesses/${businessId}/images/${imageId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "تعذر حذف الصورة");
      }

      await loadImages();
      setMessage("تم حذف الصورة بنجاح");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حذف الصورة");
    } finally {
      setDeletingId(null);
    }
  }

  async function moveImage(imageId: string, offset: -1 | 1) {
    const currentIndex = images.findIndex((image) => image.id === imageId);
    const targetIndex = currentIndex + offset;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= images.length) {
      return;
    }

    const reorderedImages = [...images];
    [reorderedImages[currentIndex], reorderedImages[targetIndex]] = [
      reorderedImages[targetIndex],
      reorderedImages[currentIndex],
    ];

    const normalizedImages = reorderedImages.map((image, sortOrder) => ({
      ...image,
      sortOrder,
    }));

    setImages(normalizedImages);
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/businesses/${businessId}/images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageIds: normalizedImages.map((image) => image.id),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "تعذر حفظ ترتيب الصور");
      }

      setMessage("تم حفظ ترتيب الصور");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ ترتيب الصور");
      await loadImages();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <section className="relative overflow-hidden rounded-[2rem] border border-sky-100 bg-gradient-to-br from-white via-white to-sky-50 p-5 shadow-sm sm:p-7">
        <div className="pointer-events-none absolute -left-16 -top-16 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="relative">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-200">
              <ImagePlus className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-black text-sky-600">معرض النشاط</p>
              <h2 className="text-xl font-black text-slate-900">إضافة صورة جديدة</h2>
              <p className="mt-1 text-xs text-slate-400">
                ارفع صورًا حقيقية من الجهاز مع ضغط تلقائي وتحديد الصورة الرئيسية.
              </p>
            </div>
          </div>

          <form onSubmit={addImage} className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr_auto]">
            <div className="lg:col-span-2">
              <label className="mb-2 block text-xs font-bold text-slate-600">
                رفع الصور من الجهاز
              </label>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-sky-100 px-4 py-2.5 text-sm font-black text-sky-700 transition hover:bg-sky-200"
                >
                  <ImagePlus className="h-4 w-4" />
                  اختر الصور
                </button>

                <div className="min-w-0 flex-1 truncate text-xs text-slate-500">
                  {selectedFiles.length > 0
                    ? selectedFiles.map((file) => file.name).join(" • ")
                    : "لا توجد صور محددة حتى الآن"}
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <p className="mt-2 text-xs text-sky-600">
                  سيتم ضغط الصور تلقائيًا وتخزينها داخل الموقع مع الاحتفاظ بصورة رئيسية إذا لم يكن هناك صورة رئيسية.
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-600">
                الوصف البديل
              </label>

              <input
                type="text"
                value={altText}
                onChange={(event) => setAltText(event.target.value)}
                placeholder={`صورة ${businessName}`}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="h-12 self-end rounded-xl bg-gradient-to-l from-sky-500 to-blue-600 px-6 text-sm font-black text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 hover:from-sky-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <ImagePlus className="h-4 w-4" />
                  {selectedFiles.length > 0 ? "رفع الصور" : "إضافة الصورة"}
                </span>
              )}
            </button>

            <div className="lg:col-span-3">
              <label className="mb-2 block text-xs font-bold text-slate-600">
                أو رابط صورة خارجية
              </label>

              <input
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://example.com/image.jpg"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                dir="ltr"
              />
            </div>
          </form>

          {message && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              <Check className="h-4 w-4" />
              {message}
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              <X className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black text-sky-600">الصور المضافة</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">معرض {businessName}</h2>
          </div>

          <span className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-black text-sky-600">
            {images.length} / 20
          </span>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[4/3] animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-500">
              <ImagePlus className="h-7 w-7" />
            </div>

            <h3 className="mt-5 text-lg font-black text-slate-800">لا توجد صور حتى الآن</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-400">
              أضف صورًا واضحة وجذابة حتى يظهر نشاطك بشكل أفضل للمستخدمين.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <article
                key={image.id}
                className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-100"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <Image
                    src={image.url}
                    alt={image.altText || businessName}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-80" />

                  {image.isPrimary && (
                    <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-black text-sky-600 shadow-lg">
                      <Star className="h-3 w-3 fill-current" />
                      الرئيسية
                    </span>
                  )}

                  <span className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur">
                    #{image.sortOrder + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => void updateImage(image.id, { isPrimary: true })}
                    disabled={saving || image.isPrimary}
                    className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-slate-500 shadow-lg backdrop-blur transition hover:bg-white hover:text-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                    title="تعيين كصورة رئيسية"
                  >
                    <Star
                      className={`h-4 w-4 ${image.isPrimary ? "fill-amber-400 text-amber-400" : ""}`}
                    />
                  </button>
                </div>

                <div className="p-4">
                  {editingId === image.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingAltText}
                        onChange={(event) => setEditingAltText(event.target.value)}
                        placeholder="الوصف البديل للصورة"
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      />

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void updateImage(image.id, { altText: editingAltText.trim() || null })}
                          className="flex-1 rounded-xl bg-sky-500 px-3 py-2 text-xs font-black text-white transition hover:bg-sky-600 disabled:opacity-50"
                        >
                          حفظ
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-800">
                          {image.altText || "بدون وصف للصورة"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">الصورة رقم {image.sortOrder + 1}</p>
                      </div>

                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => void moveImage(image.id, -1)}
                          disabled={saving || images[0]?.id === image.id}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-sky-50 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="تحريك الصورة للأعلى"
                          title="تحريك للأعلى"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => void moveImage(image.id, 1)}
                          disabled={saving || images[images.length - 1]?.id === image.id}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-sky-50 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="تحريك الصورة للأسفل"
                          title="تحريك للأسفل"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(image.id);
                            setEditingAltText(image.altText || "");
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-sky-50 hover:text-sky-600"
                          title="تعديل"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => void deleteImage(image.id)}
                          disabled={deletingId === image.id}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                          title="حذف"
                        >
                          {deletingId === image.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
