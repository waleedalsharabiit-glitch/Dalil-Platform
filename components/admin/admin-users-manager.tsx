"use client";

import { useMemo, useState } from "react";
import { Loader2, Search, Shield, UserRound, UserX } from "lucide-react";

type UserItem = { id: string; name: string | null; email: string; phone: string | null; role: "USER" | "BUSINESS_OWNER" | "ADMIN" | "SUPER_ADMIN"; isActive: boolean; createdAt: string; _count: { businesses: number; reviews: number } };
const roleLabels: Record<UserItem["role"], string> = { USER: "مستخدم", BUSINESS_OWNER: "صاحب نشاط", ADMIN: "مدير", SUPER_ADMIN: "مدير أعلى" };

export default function AdminUsersManager({ initialUsers, allowAdminRoles, currentUserId }: { initialUsers: UserItem[]; allowAdminRoles: boolean; currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const filtered = useMemo(() => { const value = query.trim().toLowerCase(); return users.filter((user) => !value || `${user.name ?? ""} ${user.email} ${user.phone ?? ""}`.toLowerCase().includes(value)); }, [users, query]);

  async function update(userId: string, payload: { role?: UserItem["role"]; isActive?: boolean }) {
    setBusyId(userId); setError("");
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "تعذر تحديث الحساب");
      setUsers((current) => current.map((user) => user.id === userId ? { ...user, ...data.user } : user));
    } catch (err) { setError(err instanceof Error ? err.message : "تعذر تحديث الحساب"); }
    finally { setBusyId(null); }
    }

  return <div dir="rtl"><label className="relative mb-5 block"><Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالاسم أو البريد أو الهاتف" className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-10 pl-3 text-sm outline-none focus:border-sky-400" /></label>{error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<div className="space-y-3">{filtered.map((user) => <article key={user.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><UserRound size={20} /></span><div><p className="font-bold text-slate-900">{user.name || "بدون اسم"}</p><p className="text-sm text-slate-500">{user.email}{user.phone ? ` · ${user.phone}` : ""}</p><p className="mt-1 text-xs text-slate-400">{user._count.businesses} نشاط · {user._count.reviews} تقييم · {new Date(user.createdAt).toLocaleDateString("ar-SA")}</p></div></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{user.isActive ? "نشط" : "معطل"}</span></div><div className="mt-4 flex flex-wrap items-center gap-2"><select value={user.role} onChange={(event) => void update(user.id, { role: event.target.value as UserItem["role"] })} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold" disabled={busyId === user.id || user.id === currentUserId || (!allowAdminRoles && (user.role === "ADMIN" || user.role === "SUPER_ADMIN"))}>{Object.entries(roleLabels).filter(([value]) => allowAdminRoles || !["ADMIN", "SUPER_ADMIN"].includes(value) || value === user.role).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" disabled={busyId === user.id || user.id === currentUserId || (!allowAdminRoles && (user.role === "ADMIN" || user.role === "SUPER_ADMIN"))} onClick={() => void update(user.id, { isActive: !user.isActive })} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50">{busyId === user.id ? <Loader2 size={14} className="animate-spin" /> : user.isActive ? <UserX size={14} /> : <Shield size={14} />}{user.isActive ? "تعطيل الحساب" : "تفعيل الحساب"}</button></div></article>)}</div>{filtered.length === 0 && <p className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">لا توجد حسابات مطابقة.</p>}</div>;
}
