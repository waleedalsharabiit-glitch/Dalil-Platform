import { NextResponse } from "next/server";
import { z } from "zod";
import { getMobileApiUser } from "@/lib/auth/mobile-api-user";
import { mobileApiErrorResponse } from "@/lib/api/mobile-response";
import { prisma } from "@/lib/db/prisma";

const favoriteSchema = z.object({ businessId: z.string().min(1).max(100) });

export async function GET(request: Request) {
  try {
    const user = await getMobileApiUser(request);
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id, business: { status: "ACTIVE" } },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, business: { select: { id: true, name: true, slug: true, description: true, isVerified: true, images: { where: { isPrimary: true }, take: 1, select: { url: true } }, locations: { take: 1, select: { city: true, district: true } } } } },
    });
    return NextResponse.json({ data: favorites.map(({ business, ...favorite }) => ({ ...favorite, business: { ...business, image: business.images[0]?.url ?? null, location: business.locations[0] ?? null, images: undefined, locations: undefined } })) });
  } catch (error) {
    return mobileApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getMobileApiUser(request);
    const parsed = favoriteSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: { message: "معرّف النشاط غير صالح" } }, { status: 400 });
    const business = await prisma.business.findFirst({ where: { id: parsed.data.businessId, status: "ACTIVE" }, select: { id: true } });
    if (!business) return NextResponse.json({ error: { message: "النشاط غير موجود" } }, { status: 404 });
    const favorite = await prisma.favorite.upsert({ where: { userId_businessId: { userId: user.id, businessId: business.id } }, create: { userId: user.id, businessId: business.id }, update: {} });
    return NextResponse.json({ data: favorite }, { status: 201 });
  } catch (error) {
    return mobileApiErrorResponse(error);
  }
}
