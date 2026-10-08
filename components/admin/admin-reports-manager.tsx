"use client";

import { useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";

type ReportItem = { id: string; type: "BUSINESS" | "REVIEW" | "USER"; reason: string; details: string | null; status: "PENDING" | "REVIEWED" | "RESOLVED" | "REJECTED"; createdAt: string; reporter: { name: string | null; email: string }; business: { name: string } | null; review: { rating: number; comment: string | null; business: { name: string } } | null; reportedUser: { name: string | null; email: string } | null };
const labels: Record<ReportItem["status"], string> = { PENDING: "جديد", REVIEWED: "قيد المراجعة", RESOLVED: "تمت المعالجة", REJECTED: "مرفوض" };
const typeLabels: Record<ReportItem["type"], string> = { BUSINESS: "نشاط", REVIEW: "تقييم", USER: "مستخدم" };

export default function AdminReportsManager({ initialReports }: { initialReports: ReportItem[] }) {
  const [reports, setReports] = useState(initialReports);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function update(id: string, status: Exclude<ReportItem["status"], "PENDING">) {
    setBusyId(id); setError("");
    try {
      const response = await fetch(`/api/admin/reports/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "تعذر تحديث البلاغ");
      setReports((current) => current.map((report) => report.id === id ? { ...report, status: data.report.status } : report));
    } catch (err) { setError(err instanceof Error ? err.message : "تعذر تحديث البلاغ"); }
    finally { setBusyId(null); }
  }
  return <div dir="rtl">{error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}{reports.length ? <div className="space-y-3">{reports.map((report) => <article key={report.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex gap-3"><ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-amber-500" /><div><p className="font-bold text-slate-900">{report.reason} <span className="text-xs font-semibold text-slate-500">· {typeLabels[report.type]}</span></p><p className="mt-1 text-xs text-slate-500">المبلّغ: {report.reporter.name || report.reporter.email} · {new Date(report.createdAt).toLocaleDateString("ar-SA")}</p><p className="mt-1 text-sm text-slate-600">{report.business?.name ?? report.review?.business.name ?? report.reportedUser?.name ?? report.reportedUser?.email ?? "عنصر محذوف"}</p>{report.review?.comment && <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{report.review.comment}</p>}{report.details && <p className="mt-2 text-sm leading-6 text-slate-600">{report.details}</p>}</div></div><span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">{labels[report.status]}</span></div><div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">{report.status !== "REVIEWED" && <button disabled={busyId === report.id} onClick={() => void update(report.id, "REVIEWED")} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-50">{busyId === report.id ? <Loader2 size={14} className="animate-spin" /> : "بدء المراجعة"}</button>}{report.status !== "RESOLVED" && <button disabled={busyId === report.id} onClick={() => void update(report.id, "RESOLVED")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">تمت المعالجة</button>}{report.status !== "REJECTED" && <button disabled={busyId === report.id} onClick={() => void update(report.id, "REJECTED")} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-50">رفض البلاغ</button>}</div></article>)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">لا توجد بلاغات.</div>}</div>;
}
