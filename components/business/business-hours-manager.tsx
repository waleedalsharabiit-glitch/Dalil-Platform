
"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Clock3,
  Copy,
  Loader2,
  Moon,
  Save,
  Sun,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";

type DayKey =
  | "SATURDAY"
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY";

interface BusinessHour {
  id?: string;
  dayOfWeek: DayKey;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
}

interface BusinessHoursManagerProps {
  businessId: string;
  initialHours: BusinessHour[];
}

const DAYS: {
  key: DayKey;
  label: string;
  shortLabel: string;
}[] = [
  {
    key: "SATURDAY",
    label: "السبت",
    shortLabel: "سبت",
  },
  {
    key: "SUNDAY",
    label: "الأحد",
    shortLabel: "أحد",
  },
  {
    key: "MONDAY",
    label: "الإثنين",
    shortLabel: "إثن",
  },
  {
    key: "TUESDAY",
    label: "الثلاثاء",
    shortLabel: "ثلا",
  },
  {
    key: "WEDNESDAY",
    label: "الأربعاء",
    shortLabel: "أرب",
  },
  {
    key: "THURSDAY",
    label: "الخميس",
    shortLabel: "خمي",
  },
  {
    key: "FRIDAY",
    label: "الجمعة",
    shortLabel: "جمع",
  },
];

const DEFAULT_OPEN = "08:00";
const DEFAULT_CLOSE = "22:00";

function normalizeHours(initialHours: BusinessHour[]) {
  return DAYS.map((day) => {
    const existing = initialHours.find(
      (hour) => hour.dayOfWeek === day.key,
    );

    return (
      existing ?? {
        dayOfWeek: day.key,
        opensAt: DEFAULT_OPEN,
        closesAt: DEFAULT_CLOSE,
        isClosed: day.key === "FRIDAY",
      }
    );
  });
}

export default function BusinessHoursManager({
  businessId,
  initialHours,
}: BusinessHoursManagerProps) {
  const [hours, setHours] = useState<BusinessHour[]>(() =>
    normalizeHours(initialHours),
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const openDays = useMemo(
    () => hours.filter((hour) => !hour.isClosed).length,
    [hours],
  );

  function updateHour(
    dayOfWeek: DayKey,
    changes: Partial<BusinessHour>,
  ) {
    setHours((current) =>
      current.map((hour) =>
        hour.dayOfWeek === dayOfWeek
          ? {
              ...hour,
              ...changes,
            }
          : hour,
      ),
    );

    setMessage("");
    setError("");
  }

  function copyDayToAll(dayOfWeek: DayKey) {
    const source = hours.find(
      (hour) => hour.dayOfWeek === dayOfWeek,
    );

    if (!source) return;

    setHours((current) =>
      current.map((hour) => ({
        ...hour,
        opensAt: source.opensAt,
        closesAt: source.closesAt,
        isClosed: source.isClosed,
      })),
    );

    setMessage("");
    setError("");
  }

  async function saveHours() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/businesses/${businessId}/hours`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            hours,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "تعذر حفظ ساعات العمل",
        );
      }

      setHours(data.hours);
      setMessage(data.message || "تم حفظ ساعات العمل بنجاح");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء الحفظ",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
            <Clock3 className="h-5 w-5" />
          </div>

          <p className="text-sm font-medium text-slate-500">
            أيام العمل
          </p>

          <p className="mt-1 text-2xl font-black text-slate-900">
            {openDays}
            <span className="mr-1 text-sm font-medium text-slate-400">
              / 7
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Sun className="h-5 w-5" />
          </div>

          <p className="text-sm font-medium text-slate-500">
            حالة النشاط
          </p>

          <p className="mt-1 text-lg font-black text-slate-900">
            {openDays > 0 ? "يعمل خلال الأسبوع" : "مغلق طوال الأسبوع"}
          </p>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <Moon className="h-5 w-5" />
          </div>

          <p className="text-sm font-medium text-slate-500">
            أيام الإغلاق
          </p>

          <p className="mt-1 text-2xl font-black text-slate-900">
            {7 - openDays}
          </p>
        </div>
      </div>

      {/* Hours */}
      <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-l from-sky-50 via-white to-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                أوقات العمل
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                حدّد أوقات فتح وإغلاق نشاطك لكل يوم.
              </p>
            </div>

            <div className="hidden rounded-full bg-sky-100 px-4 py-2 text-xs font-bold text-sky-700 sm:block">
              توقيت النشاط المحلي
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {DAYS.map((day) => {
            const hour = hours.find(
              (item) => item.dayOfWeek === day.key,
            );

            if (!hour) return null;

            return (
              <div
                key={day.key}
                className={cn(
                  "group p-4 transition-all duration-200 sm:p-5",
                  hour.isClosed
                    ? "bg-slate-50/70"
                    : "bg-white hover:bg-sky-50/40",
                )}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  {/* Day */}
                  <div className="flex min-w-45 items-center gap-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold transition",
                        hour.isClosed
                          ? "bg-slate-200 text-slate-500"
                          : "bg-sky-100 text-sky-600 group-hover:bg-sky-500 group-hover:text-white",
                      )}
                    >
                      {day.shortLabel}
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">
                        {day.label}
                      </p>

                      <p
                        className={cn(
                          "text-xs font-medium",
                          hour.isClosed
                            ? "text-slate-400"
                            : "text-emerald-600",
                        )}
                      >
                        {hour.isClosed
                          ? "مغلق"
                          : "مفتوح"}
                      </p>
                    </div>
                  </div>

                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      updateHour(day.key, {
                        isClosed: !hour.isClosed,
                      })
                    }
                    className="flex items-center gap-3 lg:mr-auto"
                    aria-label={`تغيير حالة ${day.label}`}
                  >
                    <span
                      className={cn(
                        "relative h-7 w-12 rounded-full p-1 transition-colors",
                        hour.isClosed
                          ? "bg-slate-300"
                          : "bg-sky-500",
                      )}
                    >
                      <span
                        className={cn(
                          "block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                          hour.isClosed
                            ? "translate-x-0"
                            : "-translate-x-5",
                        )}
                      />
                    </span>

                    <span className="text-sm font-semibold text-slate-600">
                      {hour.isClosed
                        ? "اليوم مغلق"
                        : "اليوم مفتوح"}
                    </span>
                  </button>

                  {/* Times */}
                  {!hour.isClosed && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`${day.key}-open`}
                          className="text-xs font-bold text-slate-500"
                        >
                          من
                        </label>

                        <input
                          id={`${day.key}-open`}
                          type="time"
                          value={hour.opensAt}
                          onChange={(event) =>
                            updateHour(day.key, {
                              opensAt: event.target.value,
                            })
                          }
                          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                        />
                      </div>

                      <span className="hidden text-slate-300 sm:block">
                        —
                      </span>

                      <div className="flex items-center gap-2">
                        <label
                          htmlFor={`${day.key}-close`}
                          className="text-xs font-bold text-slate-500"
                        >
                          إلى
                        </label>

                        <input
                          id={`${day.key}-close`}
                          type="time"
                          value={hour.closesAt}
                          onChange={(event) =>
                            updateHour(day.key, {
                              closesAt: event.target.value,
                            })
                          }
                          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                        />
                      </div>
                    </div>
                  )}

                  {/* Copy */}
                  {!hour.isClosed && (
                    <button
                      type="button"
                      onClick={() =>
                        copyDayToAll(day.key)
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600"
                    >
                      <Copy className="h-4 w-4" />
                      نسخ للباقي
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-6 text-sm">
              {message && (
                <span className="inline-flex items-center gap-2 font-semibold text-emerald-600">
                  <Check className="h-4 w-4" />
                  {message}
                </span>
              )}

              {error && (
                <span className="font-semibold text-red-600">
                  {error}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={saveHours}
              disabled={saving}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-6 font-bold text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  حفظ ساعات العمل
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
