"use client";

import { Flag } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

type TargetType = "BUSINESS" | "REVIEW" | "USER";
export default function ReportForm({ type, targetId, isAuthenticated }: { type: TargetType; targetId: string; isAuthenticated: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("معلومات غير صحيحة");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, targetId, reason, details: details || null }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "تعذر إرسال البلاغ");
      setMessage(data.message); setOpen(false); setDetails("");
    } catch (err) { setError(err instanceof Error ? err.message : "تعذر إرسال البلاغ"); }
    finally { setBusy(false); }
  }
  if (!isAuthenticated) return <Link href="/login" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600"><Flag size={13} />إبلاغ</Link>;
  return <div className="inline-block">{message ? <span role="status" className="text-xs text-emerald-700">{message}</span> : <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600"><Flag size={13} />إبلاغ</button>}{open && <form onSubmit={submit} className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"><select value={reason} onChange={(event) => setReason(event.target.value)} className="h-9 w-full rounded-lg border border-slate-200 px-2 text-xs"><option>معلومات غير صحيحة</option><option>محتوى مسيء</option><option>نشاط مكرر</option><option>اشتباه احتيال</option><option>سبب آخر</option></select><textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={1500} rows={2} placeholder="تفاصيل إضافية" className="w-full rounded-lg border border-slate-200 p-2 text-xs" />{error && <p role="alert" className="text-xs text-rose-600">{error}</p>}<button disabled={busy} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? "جارٍ الإرسال…" : "إرسال البلاغ"}</button></form>}</div>;
}
