
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .or(z.literal("")),
});

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
  request: Request,
  { params }: Params,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "يجب تسجيل الدخول.",
        },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();

    const parsed = schema.safeParse({
      ...body,
      rating: Number(body.rating),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "بيانات التقييم غير صحيحة.",
        },
        { status: 400 },
      );
    }

    const review = await prisma.review.findUnique({
      where: {
        id,
      },
    });

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          message: "التقييم غير موجود.",
        },
        { status: 404 },
      );
    }

    const isAdmin =
      session.user.role === "ADMIN" ||
      session.user.role === "SUPER_ADMIN";

    if (!isAdmin && review.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "ليس لديك صلاحية تعديل هذا التقييم.",
        },
        { status: 403 },
      );
    }

    const updated = await prisma.review.update({
      where: {
        id,
      },
      data: {
        rating: parsed.data.rating,
        comment:
          parsed.data.comment || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث التقييم.",
      review: updated,
    });
  } catch (error) {
    console.error("UPDATE_REVIEW_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "تعذر تحديث التقييم.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: Params,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "يجب تسجيل الدخول.",
        },
        { status: 401 },
      );
    }

    const { id } = await params;

    const review = await prisma.review.findUnique({
      where: {
        id,
      },
    });

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          message: "التقييم غير موجود.",
        },
        { status: 404 },
      );
    }

    const isAdmin =
      session.user.role === "ADMIN" ||
      session.user.role === "SUPER_ADMIN";

    if (!isAdmin && review.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "ليس لديك صلاحية حذف هذا التقييم.",
        },
        { status: 403 },
      );
    }

    await prisma.review.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم حذف التقييم.",
    });
  } catch (error) {
    console.error("DELETE_REVIEW_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "تعذر حذف التقييم.",
      },
      { status: 500 },
    );
  }
}
