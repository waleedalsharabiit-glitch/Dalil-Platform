"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface RequestStatusActionsProps {
  requestId: string;
  statuses: Array<{ value: "ACCEPTED" | "REJECTED" | "CANCELLED" | "COMPLETED"; label: string }>;
}

export default function RequestStatusActions({ requestId, statuses }: RequestStatusActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function update(status: RequestStatusActionsProps["statuses"][number]["value"]) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "تعذر تحديث الطلب");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحديث الطلب");
    } finally {
      setBusy(false);
    }
  }

  return <div className="flex flex-wrap gap-2">{statuses.map((status) => <button key={status.value} disabled={busy} onClick={() => void update(status.value)} className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-50 disabled:opacity-50">{busy ? "جارٍ…" : status.label}</button>)}{error && <p role="alert" className="basis-full text-xs text-rose-600">{error}</p>}</div>;
}
