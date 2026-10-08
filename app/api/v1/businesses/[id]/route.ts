import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getFirebaseApiUser } from "@/lib/auth/firebase-api-user";
import { firebaseApiErrorResponse } from "@/lib/api/firebase-response";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await getFirebaseApiUser(_request);
  } catch (error) {
    return firebaseApiErrorResponse(error);
  }
  const { id } = await params;
  const business = await prisma.business.findFirst({
    where: { status: "ACTIVE", OR: [{ id }, { slug: id }] },
    select: {
      id: true, name: true, slug: true, description: true, phone: true, whatsapp: true, website: true, isVerified: true,
      images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, altText: true, isPrimary: true } },
      locations: { select: { id: true, address: true, city: true, district: true, latitude: true, longitude: true } },
      hours: { select: { dayOfWeek: true, opensAt: true, closesAt: true, isClosed: true } },
      categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
      services: { select: { service: { select: { id: true, name: true, slug: true } } } },
      reviews: { where: { isPublished: true }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, rating: true, comment: true, createdAt: true, user: { select: { name: true, image: true } } } },
      _count: { select: { reviews: { where: { isPublished: true } } } },
    },
  });
  if (!business) return NextResponse.json({ error: { message: "النشاط غير موجود" } }, { status: 404 });
  const rating = business.reviews.length ? business.reviews.reduce((sum, review) => sum + review.rating, 0) / business.reviews.length : 0;
  return NextResponse.json({ data: { ...business, rating, reviewsCount: business._count.reviews,
    categories: business.categories.map(({ category }) => category), services: business.services.map(({ service }) => service) } });
}
