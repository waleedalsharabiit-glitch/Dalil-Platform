import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getMobileApiUser } from "@/lib/auth/mobile-api-user";
import { mobileApiErrorResponse } from "@/lib/api/mobile-response";

const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  city: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: Request) {
  try {
    await getMobileApiUser(request);
  } catch (error) {
    return mobileApiErrorResponse(error);
  }
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: { message: "معاملات البحث غير صالحة" } }, { status: 400 });
  const { q, city, category, page, limit } = parsed.data;
  const where = {
    status: "ACTIVE" as const,
    ...(q ? { OR: [
      { name: { contains: q, mode: "insensitive" as const } },
      { description: { contains: q, mode: "insensitive" as const } },
      { services: { some: { service: { name: { contains: q, mode: "insensitive" as const } } } } },
    ] } : {}),
    ...(city ? { locations: { some: { city: { contains: city, mode: "insensitive" as const } } } } : {}),
    ...(category ? { categories: { some: { category: { OR: [
      { name: { contains: category, mode: "insensitive" as const } },
      { slug: { contains: category, mode: "insensitive" as const } },
    ] } } } } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.business.count({ where }),
    prisma.business.findMany({
      where,
      orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, slug: true, description: true, phone: true, whatsapp: true, website: true, isVerified: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true, altText: true } },
        locations: { take: 1, select: { address: true, city: true, district: true, latitude: true, longitude: true } },
        categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
        services: { select: { service: { select: { id: true, name: true, slug: true } } } },
      },
    }),
  ]);
  return NextResponse.json({ data: rows.map(({ images, locations, categories, services, ...item }) => ({
    ...item, image: images[0] ?? null, location: locations[0] ?? null,
    categories: categories.map(({ category: value }) => value), services: services.map(({ service }) => service),
  })), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}
