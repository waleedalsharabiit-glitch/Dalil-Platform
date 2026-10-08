
"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";

interface FavoriteButtonProps {
  businessId: string;
  initialFavorite?: boolean;
  showLabel?: boolean;
  onToggle?: (value: boolean) => void;
}

export default function FavoriteButton({
  businessId,
  initialFavorite = false,
  showLabel = false,
  onToggle,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] =
    useState(initialFavorite);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function toggleFavorite() {
    if (loading) return;

    const nextValue = !isFavorite;
    setLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/favorites", {
        method: nextValue ? "POST" : "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ businessId }),
      });

      const contentType = response.headers.get("content-type") ?? "";

      let data: {
        success?: boolean;
        message?: string;
      } = {};

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();

        console.error("FAVORITES_NON_JSON_RESPONSE", {
          status: response.status,
          statusText: response.statusText,
          response: text,
        });

        throw new Error(
          `تعذر تحديث المفضلة. رمز الخطأ: ${response.status}`,
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ?? "تعذر تحديث المفضلة.",
        );
      }

      setIsFavorite(nextValue);
      onToggle?.(nextValue);
      setFeedback(
        nextValue
          ? "تمت إضافة النشاط إلى المفضلة"
          : "تمت إزالة النشاط من المفضلة",
      );
    } catch (error) {
      console.error("TOGGLE_FAVORITE_ERROR", error);
      setFeedback(
        error instanceof Error
          ? error.message
          : "تعذر تحديث المفضلة.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={toggleFavorite}
        disabled={loading}
        aria-label={
          isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"
        }
        className={`group inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition ${
          isFavorite
            ? "border-rose-200 bg-rose-50 text-rose-600 shadow-sm shadow-rose-100"
            : "border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart
            className={`h-4 w-4 transition ${
              isFavorite
                ? "fill-current"
                : "group-hover:scale-110"
            }`}
          />
        )}

        {showLabel &&
          (isFavorite ? "في المفضلة" : "إضافة للمفضلة")}
      </button>

      {feedback && (
        <span
          className={`text-xs ${
            feedback.includes("تمت")
              ? "text-emerald-600"
              : "text-rose-600"
          }`}
        >
          {feedback}
        </span>
      )}
    </div>
  );
}
