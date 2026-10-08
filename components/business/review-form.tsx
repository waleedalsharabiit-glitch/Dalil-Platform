
"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  MessageSquareText,
  Star,
  Trash2,
} from "lucide-react";

interface ReviewFormProps {
  businessId: string;
  existingReview?: {
    id: string;
    rating: number;
    comment: string | null;
  } | null;
}

export default function ReviewForm({
  businessId,
  existingReview = null,
}: ReviewFormProps) {
  const [rating, setRating] = useState(
    existingReview?.rating ?? 0,
  );
  const [comment, setComment] = useState(
    existingReview?.comment ?? "",
  );
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submitReview(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (rating < 1) {
      setError("اختر تقييمًا من نجمة إلى خمس نجوم.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        existingReview
          ? `/api/reviews/${existingReview.id}`
          : "/api/reviews",
        {
          method: existingReview ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            businessId,
            rating,
            comment,
          }),
        },
      );

      let data: { message?: string } | null = null;

      try {
        data = (await response.json()) as {
          message?: string;
        } | null;
      } catch {
        throw new Error(
          "استجابة الخادم غير صالحة. تأكد أن الرابط صحيح وأن المستخدم مسجّل الدخول.",
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ?? "تعذر حفظ التقييم.",
        );
      }

      setMessage(
        data?.message ?? "تم حفظ التقييم بنجاح.",
      );

      if (typeof window !== "undefined") {
        window.setTimeout(() => window.location.reload(), 900);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء حفظ التقييم.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteReview() {
    if (!existingReview?.id) return;

    setDeleting(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/reviews/${existingReview.id}`,
        {
          method: "DELETE",
        },
      );

      let data: { message?: string } | null = null;

      try {
        data = (await response.json()) as {
          message?: string;
        } | null;
      } catch {
        throw new Error(
          "استجابة الخادم غير صالحة أثناء حذف التقييم.",
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ?? "تعذر حذف التقييم.",
        );
      }

      setRating(0);
      setComment("");
      setMessage(
        data?.message ?? "تم حذف تقييمك بنجاح.",
      );

      if (typeof window !== "undefined") {
        window.setTimeout(() => window.location.reload(), 900);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء حذف التقييم.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form
      onSubmit={submitReview}
      dir="rtl"
      className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
            <MessageSquareText className="h-5 w-5" />
          </div>

          <div>
            <h3 className="font-black text-slate-900">
              {existingReview
                ? "تعديل تقييمك"
                : "قيّم هذا النشاط"}
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              شارك تجربتك لمساعدة الآخرين.
            </p>
          </div>
        </div>

        {existingReview && (
          <button
            type="button"
            onClick={deleteReview}
            disabled={deleting || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            حذف
          </button>
        )}
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-bold text-slate-700">
          تقييمك
        </p>

        <div className="flex flex-row-reverse justify-end gap-1">
          {[5, 4, 3, 2, 1].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="rounded-xl p-1 transition hover:bg-amber-50"
              aria-label={`${value} نجوم`}
            >
              <Star
                className={`h-8 w-8 transition ${
                  value <= rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={4}
        maxLength={1000}
        placeholder="اكتب تجربتك مع النشاط..."
        className="mt-5 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
      />

      {error && (
        <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || deleting}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-sky-600 to-cyan-500 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-sky-100 transition hover:from-sky-700 hover:to-cyan-600 disabled:opacity-60"
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}

        {loading
          ? "جاري الحفظ..."
          : existingReview
            ? "حفظ التعديل"
            : "نشر التقييم"}
      </button>
    </form>
  );
}
