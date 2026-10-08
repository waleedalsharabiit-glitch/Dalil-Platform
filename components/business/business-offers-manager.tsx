
"use client";

import { useState } from "react";
import {
  CalendarDays,
  Check,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react";

interface Offer {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  discount: string | number | null;
  startsAt: string;
  endsAt: string;
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "DISABLED";
}

interface Props {
  businessId: string;
  initialOffers?: Offer[];
}

const statusLabels = {
  DRAFT: "مسودة",
  ACTIVE: "نشط",
  EXPIRED: "منتهي",
  DISABLED: "معطل",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ar-YE", {
    dateStyle: "medium",
  }).format(new Date(value));

export default function BusinessOffersManager({
  businessId,
  initialOffers = [],
}: Props) {
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [discount, setDiscount] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadOffers = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/offers?businessId=${businessId}&ownerOnly=true`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "تعذر تحميل العروض.");
      }

      setOffers(data.offers ?? []);
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "تعذر تحميل العروض.",
      });
    } finally {
      setLoading(false);
    }
  };

  function resetForm() {
    setTitle("");
    setDescription("");
    setImageUrl("");
    setDiscount("");
    setStartsAt("");
    setEndsAt("");
    setEditingId(null);
  }

  function editOffer(offer: Offer) {
    setEditingId(offer.id);
    setTitle(offer.title);
    setDescription(offer.description ?? "");
    setImageUrl(offer.imageUrl ?? "");
    setDiscount(offer.discount !== null ? String(offer.discount) : "");
    setStartsAt(new Date(offer.startsAt).toISOString().slice(0, 16));
    setEndsAt(new Date(offer.endsAt).toISOString().slice(0, 16));
    setOpen(true);
    setFeedback(null);
  }

  async function saveOffer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !startsAt || !endsAt) {
      setFeedback({
        type: "error",
        text: "يرجى تعبئة عنوان العرض وتاريخ البداية والنهاية.",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(
        editingId ? `/api/offers/${editingId}` : "/api/offers",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            businessId,
            title: title.trim(),
            description: description.trim() || null,
            imageUrl: imageUrl.trim() || undefined,
            discount: discount === "" ? null : Number(discount),
            startsAt: new Date(startsAt).toISOString(),
            endsAt: new Date(endsAt).toISOString(),
            status: "ACTIVE",
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "تعذر حفظ العرض.");
      }

      setFeedback({
        type: "success",
        text: editingId ? "تم تحديث العرض بنجاح." : "تم إضافة العرض بنجاح.",
      });
      resetForm();
      setOpen(false);
      await loadOffers();
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "تعذر حفظ العرض.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleOffer(offer: Offer) {
    const nextStatus = offer.status === "ACTIVE" ? "DISABLED" : "ACTIVE";

    try {
      const response = await fetch(`/api/offers/${offer.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "تعذر تغيير حالة العرض.");
      }

      setFeedback({
        type: "success",
        text: "تم تحديث حالة العرض.",
      });
      await loadOffers();
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "تعذر تغيير حالة العرض.",
      });
    }
  }

  async function deleteOffer(id: string) {
    if (!window.confirm("هل أنت متأكد من حذف هذا العرض؟")) {
      return;
    }

    try {
      const response = await fetch(`/api/offers/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message ?? "تعذر حذف العرض.");
      }

      setFeedback({
        type: "success",
        text: "تم حذف العرض بنجاح.",
      });
      await loadOffers();
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "تعذر حذف العرض.",
      });
    }
  }

  return (
    <section dir="rtl" className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-l from-sky-50 via-white to-cyan-50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 shadow-sm">
            <Megaphone className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-black text-slate-900">العروض</h2>
            <p className="mt-1 text-xs text-slate-500">
              أنشئ عروضًا جذابة لعملاء النشاط.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setOpen(true);
            setFeedback(null);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-sky-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-100 transition hover:from-sky-700 hover:to-cyan-600"
        >
          <Plus className="h-4 w-4" />
          إضافة عرض
        </button>
      </div>

      {feedback && (
        <div className="px-6 pt-5">
          <div
            className={`rounded-2xl px-4 py-3 text-sm font-bold ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            {feedback.text}
          </div>
        </div>
      )}

      {open && (
        <div className="border-b border-slate-100 bg-slate-50/80 p-6">
          <form onSubmit={saveOffer} className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900">
                  {editingId ? "تعديل العرض" : "عرض جديد"}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  اجعل العرض واضحًا ومباشرًا.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input label="عنوان العرض" value={title} onChange={setTitle} placeholder="خصم 20% على الخدمة" required />
              <Input label="نسبة الخصم" value={discount} onChange={setDiscount} placeholder="20" type="number" min="0" max="100" />
              <Input label="تاريخ البداية" value={startsAt} onChange={setStartsAt} type="datetime-local" required />
              <Input label="تاريخ النهاية" value={endsAt} onChange={setEndsAt} type="datetime-local" required />
              <Input label="رابط الصورة" value={imageUrl} onChange={setImageUrl} placeholder="https://..." />

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  وصف العرض
                </label>

                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  placeholder="اشرح تفاصيل العرض..."
                />
              </div>
            </div>

            <button
              disabled={saving}
              type="submit"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-slate-900 to-slate-700 px-6 py-3 text-sm font-black text-white transition hover:from-slate-800 hover:to-slate-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? "جاري الحفظ..." : "حفظ العرض"}
            </button>
          </form>
        </div>
      )}

      <div className="p-6">
        {loading ? (
          <div className="py-12 text-center text-sm font-black text-slate-400">جاري تحميل العروض...</div>
        ) : offers.length === 0 ? (
          <div className="rounded-[1.6rem] border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
            <Megaphone className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-4 text-sm font-black text-slate-600">لم تضف أي عروض بعد.</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {offers.map((offer) => (
              <article key={offer.id} className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sky-100">
                {offer.imageUrl && (
                  <div className="relative h-40 overflow-hidden bg-slate-100">
                    <img src={offer.imageUrl} alt={offer.title} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-slate-900">{offer.title}</h3>
                      {offer.description && (
                        <p className="mt-2 text-xs leading-6 text-slate-500">{offer.description}</p>
                      )}
                    </div>

                    {offer.discount !== null && (
                      <span className="shrink-0 rounded-xl bg-orange-50 px-3 py-2 text-sm font-black text-orange-600">
                        خصم {offer.discount}%
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
                    <CalendarDays className="h-4 w-4 text-sky-500" />
                    {formatDate(offer.startsAt)} — {formatDate(offer.endsAt)}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-black ${
                        offer.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-600"
                          : offer.status === "DISABLED"
                            ? "bg-slate-100 text-slate-500"
                            : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {statusLabels[offer.status]}
                    </span>

                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => editOffer(offer)} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600" aria-label="تعديل العرض">
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button type="button" onClick={() => void toggleOffer(offer)} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600" aria-label="تغيير حالة العرض">
                        <Power className="h-4 w-4" />
                      </button>

                      <button type="button" onClick={() => void deleteOffer(offer.id)} className="rounded-xl border border-red-100 p-2 text-red-400 transition hover:bg-red-50 hover:text-red-600" aria-label="حذف العرض">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  min?: string;
  max?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      <input
        type={type}
        required={required}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
      />
    </label>
  );
}
