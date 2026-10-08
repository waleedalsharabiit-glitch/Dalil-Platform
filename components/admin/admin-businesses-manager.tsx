"use client";

import { useState } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";

type BusinessItem = { id: string; name: string; slug: string; status: "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED"; isVerified: boolean; createdAt: string; owner: { name: string | null; email: string }; _count: { reviews: number; requests: number } };
const labels: Record<BusinessItem["status"], string> = { PENDING: "قيد المراجعة", ACTIVE: "نشط", SUSPENDED: "موقوف", REJECTED: "مرفوض" };

export default function AdminBusinessesManager({ initialBusinesses }: { initialBusinesses: BusinessItem[] }) {
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function update(id: string, payload: { status?: BusinessItem["status"]; isVerified?: boolean }) {
    setBusyId(id); setError("");
    try {
      const response = await fetch(`/api/admin/businesses/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "تعذر تحديث النشاط");
      setBusinesses((current) => current.map((business) => business.id === id ? { ...business, ...data.business } : business));
    } catch (err) { setError(err instanceof Error ? err.message : "تعذر تحديث النشاط"); }
    finally { setBusyId(null); }
  }
  return <div dir="rtl">{error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<div className="space-y-3">{businesses.map((business) => <article key={business.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-bold text-slate-900">{business.name}</h2><p className="mt-1 text-sm text-slate-500">{business.owner.name || business.owner.email} · {business.owner.email}</p><p className="mt-1 text-xs text-slate-400">{business._count.reviews} تقييم · {business._count.requests} طلب · {new Date(business.createdAt).toLocaleDateString("ar-SA")}</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">{labels[business.status]}</span>{business.isVerified && <BadgeCheck className="h-5 w-5 text-sky-600" />}</div></div><div className="mt-4 flex flex-wrap gap-2"><select value={business.status} disabled={busyId === business.id} onChange={(event) => void update(business.id, { status: event.target.value as BusinessItem["status"] })} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold">{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" disabled={busyId === business.id} onClick={() => void update(business.id, { isVerified: !business.isVerified })} className="inline-flex h-9 items-center gap-2 rounded-lg border border-sky-200 px-3 text-xs font-bold text-sky-700 hover:bg-sky-50 disabled:opacity-50">{busyId === business.id && <Loader2 size={14} className="animate-spin" />}{business.isVerified ? "إلغاء التوثيق" : "توثيق النشاط"}</button></div></article>)}</div>{businesses.length === 0 && <p className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">لا توجد أنشطة.</p>}</div>;
}
