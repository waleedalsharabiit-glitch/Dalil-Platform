
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const offerSchema = z.object({
  businessId: z.string().min(1),
  title: z.string().trim().min(2).max(150),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal("")),
  imageUrl: z
    .string()
    .trim()
    .url()
    .optional()
    .or(z.literal("")),
  discount: z
    .number()
    .min(0)
    .max(100)
    .nullable()
    .optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  status: z
    .enum(["DRAFT", "ACTIVE", "EXPIRED", "DISABLED"])
    .optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const businessId =
      searchParams.get("businessId")?.trim();

    const ownerOnly =
      searchParams.get("ownerOnly") === "true";

    const session = await auth();

    if (ownerOnly && !session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "يجب تسجيل الدخول.",
        },
        { status: 401 },
      );
    }

    const where: {
      businessId?: string;
      status?: "ACTIVE";
      business?: {
        ownerId: string;
      };
    } = {};

    if (businessId) {
      where.businessId = businessId;
    }

    if (!ownerOnly) {
      where.status = "ACTIVE";
    }

    if (ownerOnly) {
      where.business = {
        ownerId: session!.user!.id,
      };
    }

    const offers = await prisma.offer.findMany({
      where,
      orderBy: {
        startsAt: "desc",
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      offers,
    });
  } catch (error) {
    console.error("GET_OFFERS_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "تعذر تحميل العروض.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
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

    if (
      session.user.role !== "BUSINESS_OWNER" &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "ليس لديك صلاحية إنشاء عروض.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const parsed = offerSchema.safeParse({
      ...body,
      discount:
        body.discount === "" ||
        body.discount === null ||
        body.discount === undefined
          ? null
          : Number(body.discount),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            parsed.error.issues[0]?.message ??
            "بيانات العرض غير صحيحة.",
        },
        { status: 400 },
      );
    }

    const startsAt = new Date(parsed.data.startsAt);
    const endsAt = new Date(parsed.data.endsAt);

    if (endsAt <= startsAt) {
      return NextResponse.json(
        {
          success: false,
          message:
            "تاريخ نهاية العرض يجب أن يكون بعد تاريخ البداية.",
        },
        { status: 400 },
      );
    }

    const business = await prisma.business.findUnique({
      where: {
        id: parsed.data.businessId,
      },
      select: {
        id: true,
        name: true,
        ownerId: true,
        status: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        {
          success: false,
          message: "النشاط غير موجود.",
        },
        { status: 404 },
      );
    }

    const isAdmin =
      session.user.role === "ADMIN" ||
      session.user.role === "SUPER_ADMIN";

    if (!isAdmin && business.ownerId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "لا يمكنك إدارة عروض هذا النشاط.",
        },
        { status: 403 },
      );
    }

    const offer = await prisma.offer.create({
      data: {
        businessId: business.id,
        title: parsed.data.title,
        description:
          parsed.data.description || null,
        imageUrl:
          parsed.data.imageUrl || null,
        discount: parsed.data.discount,
        startsAt,
        endsAt,
        status: parsed.data.status ?? "DRAFT",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم إنشاء العرض بنجاح.",
        offer,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE_OFFER_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "تعذر إنشاء العرض.",
      },
      { status: 500 },
    );
  }
}
