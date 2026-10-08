"use client";

import Link from "next/link";
import { useState } from "react";

interface ServiceRequestFormProps {
  businessId: string;
  services: Array<{ id: string; name: string }>;
  isAuthenticated: boolean;
}

export default function ServiceRequestForm({ businessId, services, isAuthenticated }: ServiceRequestFormProps) {
  const [serviceId, setServiceId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!isAuthenticated) {
    return <div className="mt-5 rounded-xl bg-sky-50 p-4 text-sm text-slate-600">لتقديم طلب خدمة، <Link href="/login" className="font-bold text-sky-700 underline">سجّل الدخول</Link>.</div>;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, serviceId: serviceId || null, title, description: description || null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "تعذر إرسال الطلب");
      setMessage("وصل طلبك إلى النشاط. يمكنك متابعة حالته من صفحة طلباتي.");
      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إرسال الطلب");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-3" dir="rtl">
      {services.length > 0 && (
        <label className="block space-y-2">
          <span className="text-xs font-bold text-slate-600">الخدمة المطلوبة (اختياري)</span>
          <select value={serviceId} onChange={(event) => setServiceId(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-sky-400">
            <option value="">طلب عام</option>
            {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
          </select>
        </label>
      )}
      <input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={3} maxLength={120} placeholder="عنوان الطلب" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400" />
      <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} rows={3} placeholder="اشرح احتياجك باختصار (اختياري)" className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-sky-400" />
      {message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">{message} <Link href="/requests" className="font-bold underline">طلباتي</Link></p>}
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
      <button disabled={busy} className="h-11 w-full rounded-xl bg-sky-600 px-4 text-sm font-bold text-white transition hover:bg-sky-700 disabled:opacity-60">{busy ? "جارٍ الإرسال…" : "إرسال طلب الخدمة"}</button>
    </form>
  );
}
