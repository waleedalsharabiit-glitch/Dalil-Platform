
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const schema = z.object({
  title: z.string().trim().min(2).max(150).optional(),
  description: z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .optional(),
  imageUrl: z.string().trim().url().nullable().optional(),
  discount: z.number().min(0).max(100).nullable().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  status: z
    .enum(["DRAFT", "ACTIVE", "EXPIRED", "DISABLED"])
    .optional(),
});

interface Params {
  params: Promise<{
    id: string;
  }>;
}

async function getAuthorizedOffer(
  id: string,
  userId: string,
  role: string,
) {
  const offer = await prisma.offer.findUnique({
    where: {
      id,
    },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          ownerId: true,
        },
      },
    },
  });

  if (!offer) return null;

  const isAdmin =
    role === "ADMIN" || role === "SUPER_ADMIN";

  if (!isAdmin && offer.business.ownerId !== userId) {
    return null;
  }

  return offer;
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
    const offer = await getAuthorizedOffer(
      id,
      session.user.id,
      session.user.role,
    );

    if (!offer) {
      return NextResponse.json(
        {
          success: false,
          message: "العرض غير موجود أو ليس لديك صلاحية.",
        },
        { status: 404 },
      );
    }

    const body = await request.json();

    const parsed = schema.safeParse({
      ...body,
      discount:
        body.discount === "" ||
        body.discount === undefined
          ? undefined
          : body.discount === null
            ? null
            : Number(body.discount),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "بيانات العرض غير صحيحة.",
        },
        { status: 400 },
      );
    }

    const startsAt = parsed.data.startsAt
      ? new Date(parsed.data.startsAt)
      : offer.startsAt;

    const endsAt = parsed.data.endsAt
      ? new Date(parsed.data.endsAt)
      : offer.endsAt;

    if (endsAt <= startsAt) {
      return NextResponse.json(
        {
          success: false,
          message:
            "تاريخ النهاية يجب أن يكون بعد تاريخ البداية.",
        },
        { status: 400 },
      );
    }

    const updated = await prisma.offer.update({
      where: {
        id,
      },
      data: {
        ...(parsed.data.title !== undefined && {
          title: parsed.data.title,
        }),
        ...(parsed.data.description !== undefined && {
          description: parsed.data.description,
        }),
        ...(parsed.data.imageUrl !== undefined && {
          imageUrl: parsed.data.imageUrl,
        }),
        ...(parsed.data.discount !== undefined && {
          discount: parsed.data.discount,
        }),
        startsAt,
        endsAt,
        ...(parsed.data.status !== undefined && {
          status: parsed.data.status,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث العرض.",
      offer: updated,
    });
  } catch (error) {
    console.error("UPDATE_OFFER_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "تعذر تحديث العرض.",
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

    const offer = await getAuthorizedOffer(
      id,
      session.user.id,
      session.user.role,
    );

    if (!offer) {
      return NextResponse.json(
        {
          success: false,
          message: "العرض غير موجود أو ليس لديك صلاحية.",
        },
        { status: 404 },
      );
    }

    await prisma.offer.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم حذف العرض.",
    });
  } catch (error) {
    console.error("DELETE_OFFER_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "تعذر حذف العرض.",
      },
      { status: 500 },
    );
  }
}
