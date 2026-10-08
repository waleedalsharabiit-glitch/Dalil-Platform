"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Tag, Trash2, X } from "lucide-react";

interface BusinessOption { id: string; name: string }
interface OfferItem {
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  discount: string | null;
  startsAt: string;
  endsAt: string;
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "DISABLED";
}
interface Props { businesses: BusinessOption[]; offers: OfferItem[] }

const blank = {
  businessId: "",
  title: "",
  description: "",
  imageUrl: "",
  discount: "",
  startsAt: "",
  endsAt: "",
  status: "DRAFT" as "DRAFT" | "ACTIVE" | "DISABLED",
};

const statusLabels: Record<OfferItem["status"], string> = {
  DRAFT: "مسودة",
  ACTIVE: "نشط",
  EXPIRED: "منتهي",
  DISABLED: "متوقف",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ar-YE", {
    dateStyle: "medium",
  }).format(new Date(value));

export default function OffersManager({ businesses, offers: initialOffers }: Props) {
  const [offers, setOffers] = useState(initialOffers);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function edit(offer: OfferItem) {
    setEditingId(offer.id);
    setForm({
      businessId: offer.businessId,
      title: offer.title,
      description: offer.description ?? "",
      imageUrl: offer.imageUrl ?? "",
      discount: offer.discount ?? "",
      startsAt: new Date(offer.startsAt).toISOString().slice(0, 16),
      endsAt: new Date(offer.endsAt).toISOString().slice(0, 16),
      status: offer.status === "EXPIRED" ? "DISABLED" : offer.status,
    });
    setError("");
    setMessage("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const payload = {
      ...form,
      description: form.description || null,
      imageUrl: form.imageUrl || null,
      discount: form.discount ? Number(form.discount) : null,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
    };

    try {
      const response = await fetch(editingId ? `/api/offers/${editingId}` : "/api/offers", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "تعذر حفظ العرض");

      const saved = {
        ...data.offer,
        businessName:
          businesses.find((business) => business.id === data.offer.businessId)?.name ?? "نشاط",
      } as OfferItem;

      setOffers((current) =>
        editingId
          ? current.map((offer) => (offer.id === editingId ? { ...offer, ...saved } : offer))
          : [saved, ...current],
      );

      setMessage(editingId ? "تم تحديث العرض بنجاح" : "تم إنشاء العرض بنجاح");
      setEditingId(null);
      setForm({ ...blank, businessId: businesses[0]?.id ?? "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ العرض");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("هل تريد حذف هذا العرض؟")) return;

    setDeletingId(id);
    setError("");

    try {
      const response = await fetch(`/api/offers/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "تعذر حذف العرض");
      setOffers((current) => current.filter((offer) => offer.id !== id));
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حذف العرض");
    } finally {
      setDeletingId(null);
    }
  }

  if (!businesses.length) {
    return (
      <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        أضف نشاطًا أولًا حتى تتمكن من إنشاء العروض.
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <form onSubmit={submit} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {editingId ? "تعديل العرض" : "إنشاء عرض جديد"}
              </h2>
            </div>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(blank);
              }}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="إلغاء التعديل"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <select
            required
            value={form.businessId}
            onChange={(e) => setForm({ ...form, businessId: e.target.value })}
            disabled={Boolean(editingId)}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          >
            <option value="">اختر النشاط</option>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>

          <input
            required
            minLength={3}
            maxLength={120}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="عنوان العرض"
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />

          <input
            type="url"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="رابط صورة العرض (اختياري)"
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            dir="ltr"
          />

          <input
            type="number"
            min="0.01"
            max="100"
            step="0.01"
            value={form.discount}
            onChange={(e) => setForm({ ...form, discount: e.target.value })}
            placeholder="نسبة الخصم % (اختياري)"
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          />

          <label className="space-y-1 text-xs font-bold text-slate-600">
            يبدأ في
            <input
              required
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </label>

          <label className="space-y-1 text-xs font-bold text-slate-600">
            ينتهي في
            <input
              required
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              className="mt-1 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
          </label>

          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          >
            <option value="DRAFT">مسودة</option>
            <option value="ACTIVE">نشط</option>
            <option value="DISABLED">متوقف</option>
          </select>

          <textarea
            maxLength={1500}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="تفاصيل العرض"
            rows={3}
            className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 sm:col-span-2"
          />
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-bold text-rose-700">
            {error}
          </p>
        )}

        {message && (
          <p role="status" className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
            {message}
          </p>
        )}

        <button
          disabled={busy}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-l from-sky-600 to-cyan-500 px-5 text-sm font-black text-white shadow-lg shadow-sky-100 transition hover:from-sky-700 hover:to-cyan-600 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {busy ? "جارٍ الحفظ…" : editingId ? "حفظ التعديلات" : "إضافة العرض"}
        </button>
      </form>

      <div className="space-y-3">
        {offers.map((offer) => (
          <article
            key={offer.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-black text-slate-900">{offer.title}</h3>
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">
                  {statusLabels[offer.status]}
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                {offer.businessName}
                {offer.discount ? ` · خصم ${offer.discount}%` : ""} · {formatDate(offer.startsAt)} — {formatDate(offer.endsAt)}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => edit(offer)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-sky-700 transition hover:bg-sky-50"
                aria-label="تعديل"
              >
                <Pencil size={16} />
              </button>

              <button
                type="button"
                disabled={deletingId === offer.id}
                onClick={() => void remove(offer.id)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                aria-label="حذف"
              >
                {deletingId === offer.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
