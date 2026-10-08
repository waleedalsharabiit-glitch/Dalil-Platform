import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import AdminBusinessesManager from "@/components/admin/admin-businesses-manager";

export default async function AdminBusinessesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") redirect("/dashboard");
  const businesses = await prisma.business.findMany({ include: { owner: { select: { id: true, name: true, email: true } }, _count: { select: { reviews: true, requests: true } } }, orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 500 });
  const initialBusinesses = businesses.map((business) => ({ ...business, createdAt: business.createdAt.toISOString() }));
  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6" dir="rtl"><header className="rounded-3xl bg-gradient-to-br from-sky-600 to-cyan-500 p-7 text-white"><div className="flex items-center gap-3"><Building2 className="h-8 w-8" /><div><h1 className="text-2xl font-black">إدارة الأنشطة والتحقق</h1><p className="mt-1 text-sm text-sky-50">راجع الطلبات الجديدة، وفعّل الأنشطة ووثّقها.</p></div></div></header><AdminBusinessesManager initialBusinesses={initialBusinesses} /></main>;
}
