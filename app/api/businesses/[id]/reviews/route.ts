import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1500).nullable().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "سجّل الدخول لإضافة تقييم" }, { status: 401 });
  }

  const { id: businessId } = await params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "اختر تقييمًا من نجمة إلى خمس نجوم", errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { ownerId: true, status: true },
  });
  if (!business || business.status !== "ACTIVE") {
    return NextResponse.json({ message: "النشاط غير متاح للتقييم" }, { status: 404 });
  }
  if (business.ownerId === session.user.id) {
    return NextResponse.json({ message: "لا يمكنك تقييم نشاطك" }, { status: 400 });
  }

  const review = await prisma.review.upsert({
    where: { userId_businessId: { userId: session.user.id, businessId } },
    create: {
      userId: session.user.id,
      businessId,
      rating: parsed.data.rating,
      comment: parsed.data.comment?.trim() || null,
    },
    update: {
      rating: parsed.data.rating,
      comment: parsed.data.comment?.trim() || null,
      isPublished: true,
    },
    select: { id: true, rating: true, comment: true, createdAt: true },
  });
  return NextResponse.json({ review, message: "تم حفظ تقييمك" });
}
