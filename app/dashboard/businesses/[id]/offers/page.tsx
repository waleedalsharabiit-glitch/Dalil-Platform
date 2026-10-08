
import { notFound, redirect } from "next/navigation";

import BusinessOffersManager from "@/components/business/business-offers-manager";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function BusinessOffersPage({
  params,
}: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const business = await prisma.business.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
    },
  });

  if (!business) {
    notFound();
  }

  const isAdmin =
    session.user.role === "ADMIN" ||
    session.user.role === "SUPER_ADMIN";

  if (!isAdmin && business.ownerId !== session.user.id) {
    notFound();
  }

  const initialOffers = await prisma.offer.findMany({
    where: {
      businessId: business.id,
    },
    orderBy: {
      startsAt: "desc",
    },
  });

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f0f9ff] px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="text-xs font-black tracking-[0.2em] text-sky-600">
            BUSINESS OFFERS
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900">
            عروض {business.name}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            أنشئ عروضًا وخصومات تظهر لزوار نشاطك.
          </p>
        </div>

        <BusinessOffersManager
          businessId={business.id}
          initialOffers={initialOffers.map((offer) => ({
            id: offer.id,
            title: offer.title,
            description: offer.description,
            imageUrl: offer.imageUrl,
            discount: offer.discount ? String(offer.discount) : null,
            startsAt: offer.startsAt.toISOString(),
            endsAt: offer.endsAt.toISOString(),
            status: offer.status,
          }))}
        />
      </div>
    </main>
  );
}
