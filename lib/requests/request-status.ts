export type RequestStatusFilter =
  | "ALL"
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

export const requestStatusMeta = {
  ALL: {
    label: "كل الحالات",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  PENDING: {
    label: "قيد الانتظار",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  ACCEPTED: {
    label: "مقبول",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  REJECTED: {
    label: "مرفوض",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  CANCELLED: {
    label: "ملغي",
    className: "border-slate-200 bg-slate-100 text-slate-600",
  },
  COMPLETED: {
    label: "مكتمل",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
} as const;

export const requestStatusOptions = Object.entries(requestStatusMeta).map(
  ([value, meta]) => ({
    value: value as RequestStatusFilter,
    label: meta.label,
  }),
);

export function getRequestNotificationLink(
  requestId: string,
  viewer: "USER" | "OWNER",
) {
  if (viewer === "USER") {
    return "/requests?status=ACCEPTED";
  }

  return `/dashboard/requests/${requestId}`;
}
