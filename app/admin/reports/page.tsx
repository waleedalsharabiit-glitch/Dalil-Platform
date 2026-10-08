
"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileWarning,
  Loader2,
  XCircle,
} from "lucide-react";

interface Report {
  id: string;
  type: "BUSINESS" | "REVIEW" | "USER";
  reason: string;
  details: string | null;
  status:
    | "PENDING"
    | "REVIEWED"
    | "RESOLVED"
    | "REJECTED";
  createdAt: string;
  reporter: {
    name: string | null;
    email: string;
  };
  business: {
    name: string;
  } | null;
  review: {
    rating: number;
    comment: string | null;
  } | null;
  reportedUser: {
    name: string | null;
    email: string;
  } | null;
}

const statusConfig = {
  PENDING: {
    label: "قيد المراجعة",
    className: "bg-amber-50 text-amber-700",
    icon: Clock3,
  },
  REVIEWED: {
    label: "تمت المراجعة",
    className: "bg-sky-50 text-sky-700",
    icon: AlertTriangle,
  },
  RESOLVED: {
    label: "تم الحل",
    className: "bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "مرفوض",
    className: "bg-red-50 text-red-700",
    icon: XCircle,
  },
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const response = await fetch(
        "/api/admin/reports",
      );

      const data = await response.json();

      if (response.ok) {
        setReports(data.reports ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(
    id: string,
    status: Report["status"],
  ) {
    const response = await fetch(
      `/api/admin/reports/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
        }),
      },
    );

    if (response.ok) {
      await load();
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f0f9ff] px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-7">
          <p className="text-xs font-black tracking-[0.2em] text-red-500">
            MODERATION
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900">
            البلاغات
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            مراجعة بلاغات المستخدمين والأنشطة والتقييمات.
          </p>
        </header>

        {loading ? (
          <div className="rounded-[2rem] bg-white py-20 text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-sky-500" />
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
            <FileWarning className="mx-auto h-10 w-10 text-slate-300" />

            <h2 className="mt-5 font-black text-slate-800">
              لا توجد بلاغات
            </h2>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const config =
                statusConfig[report.status];

              const Icon = config.icon;

              return (
                <article
                  key={report.id}
                  className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-black text-red-600">
                          {report.type}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${config.className}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {config.label}
                        </span>
                      </div>

                      <h2 className="mt-4 font-black text-slate-900">
                        {report.reason}
                      </h2>

                      {report.details && (
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                          {report.details}
                        </p>
                      )}

                      <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                        <p>
                          المبلّغ:{" "}
                          <strong className="text-slate-700">
                            {report.reporter.name ||
                              report.reporter.email}
                          </strong>
                        </p>

                        {report.business && (
                          <p>
                            النشاط:{" "}
                            <strong className="text-slate-700">
                              {report.business.name}
                            </strong>
                          </p>
                        )}

                        {report.reportedUser && (
                          <p>
                            المستخدم المبلّغ عنه:{" "}
                            <strong className="text-slate-700">
                              {report.reportedUser.name ||
                                report.reportedUser.email}
                            </strong>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {report.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              updateStatus(
                                report.id,
                                "REVIEWED",
                              )
                            }
                            className="rounded-xl bg-sky-50 px-4 py-2.5 text-xs font-black text-sky-700 hover:bg-sky-100"
                          >
                            تمت المراجعة
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              updateStatus(
                                report.id,
                                "RESOLVED",
                              )
                            }
                            className="rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-700 hover:bg-emerald-100"
                          >
                            حل البلاغ
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              updateStatus(
                                report.id,
                                "REJECTED",
                              )
                            }
                            className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-black text-red-700 hover:bg-red-100"
                          >
                            رفض
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
