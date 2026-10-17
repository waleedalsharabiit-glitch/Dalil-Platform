import { NextResponse } from "next/server";
import { z } from "zod";
import { getMobileApiUser } from "@/lib/auth/mobile-api-user";
import { mobileApiErrorResponse } from "@/lib/api/mobile-response";
import { prisma } from "@/lib/db/prisma";

const reviewSchema = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().trim().max(2000).optional().nullable() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getMobileApiUser(request);
    const { id } = await params;
    const parsed = reviewSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: { message: "التقييم يجب أن يكون من 1 إلى 5" } }, { status: 400 });
    const business = await prisma.business.findFirst({ where: { OR: [{ id }, { slug: id }], status: "ACTIVE" }, select: { id: true } });
    if (!business) return NextResponse.json({ error: { message: "النشاط غير موجود" } }, { status: 404 });
    const review = await prisma.review.upsert({
      where: { userId_businessId: { userId: user.id, businessId: business.id } },
      create: { userId: user.id, businessId: business.id, rating: parsed.data.rating, comment: parsed.data.comment || null },
      update: { rating: parsed.data.rating, comment: parsed.data.comment || null, isPublished: true },
      select: { id: true, rating: true, comment: true, createdAt: true },
    });
    return NextResponse.json({ data: review }, { status: 201 });
  } catch (error) {
    return mobileApiErrorResponse(error);
  }
}
