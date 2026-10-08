import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const reviewSchema = z.object({
  businessId: z.string().min(1, "معرف النشاط غير صالح"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1500).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "يجب تسجيل الدخول لإضافة تقييم" },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "بيانات التقييم غير صحيحة." },
        { status: 400 },
      );
    }

    const parsed = reviewSchema.safeParse({
      ...body,
      rating: Number(body.rating),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "اختر تقييمًا من نجمة إلى خمس نجوم",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { businessId, rating, comment } = parsed.data;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true, status: true },
    });

    if (!business || business.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, message: "النشاط غير متاح للتقييم" },
        { status: 404 },
      );
    }

    if (business.ownerId === session.user.id) {
      return NextResponse.json(
        { success: false, message: "لا يمكنك تقييم نشاطك" },
        { status: 400 },
      );
    }

    const review = await prisma.review.upsert({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId,
        },
      },
      create: {
        userId: session.user.id,
        businessId,
        rating,
        comment: comment?.trim() || null,
      },
      update: {
        rating,
        comment: comment?.trim() || null,
        isPublished: true,
      },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم حفظ تقييمك",
      review,
    });
  } catch (error) {
    console.error("CREATE_REVIEW_ERROR", error);

    return NextResponse.json(
      { success: false, message: "تعذر حفظ التقييم." },
      { status: 500 },
    );
  }
}
