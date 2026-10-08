import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import AdminUsersManager from "@/components/admin/admin-users-manager";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") redirect("/dashboard");
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true, _count: { select: { businesses: true, reviews: true } } }, orderBy: { createdAt: "desc" }, take: 500 });
  const initialUsers = users.map((user) => ({ ...user, createdAt: user.createdAt.toISOString() }));
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6" dir="rtl"><header className="rounded-3xl bg-gradient-to-br from-sky-600 to-cyan-500 p-7 text-white"><div className="flex items-center gap-3"><Users className="h-8 w-8" /><div><h1 className="text-2xl font-black">إدارة المستخدمين</h1><p className="mt-1 text-sm text-sky-50">راجع الحسابات والصلاحيات وحالة التفعيل.</p></div></div></header><AdminUsersManager initialUsers={initialUsers} allowAdminRoles={session.user.role === "SUPER_ADMIN"} currentUserId={session.user.id} /></main>;
}
