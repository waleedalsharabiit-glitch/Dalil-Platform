import { redirect } from "next/navigation";
import { Tag } from "lucide-react";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import OffersManager from "@/components/business/offers-manager";

export default async function OffersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "BUSINESS_OWNER" && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") redirect("/dashboard");

  const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";
  const [businesses, offers] = await Promise.all([
    prisma.business.findMany({ where: isAdmin ? undefined : { ownerId: session.user.id }, select: { id: true, name: true }, orderBy: { createdAt: "desc" } }),
    prisma.offer.findMany({ where: isAdmin ? undefined : { business: { ownerId: session.user.id } }, include: { business: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
  ]);

  const initialOffers = offers.map((offer) => ({ id: offer.id, businessId: offer.businessId, businessName: offer.business.name, title: offer.title, description: offer.description, imageUrl: offer.imageUrl, discount: offer.discount?.toString() ?? null, startsAt: offer.startsAt.toISOString(), endsAt: offer.endsAt.toISOString(), status: offer.status }));

  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6" dir="rtl"><header className="rounded-3xl bg-gradient-to-br from-sky-600 to-cyan-500 p-7 text-white"><div className="flex items-center gap-3"><Tag className="h-8 w-8" /><div><h1 className="text-2xl font-black">العروض</h1><p className="mt-1 text-sm text-sky-50">أنشئ العروض وحدد فترة ظهورها.</p></div></div></header><OffersManager businesses={businesses} offers={initialOffers} /></main>;
}
