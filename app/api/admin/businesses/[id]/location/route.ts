import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const locationSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

async function getAuthorizedBusiness(businessId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        {
          message: "يجب تسجيل الدخول أولاً.",
        },
        { status: 401 },
      ),
    };
  }

  const business = await prisma.business.findUnique({
    where: {
      id: businessId,
    },
    select: {
      id: true,
      ownerId: true,
    },
  });

  if (!business) {
    return {
      error: NextResponse.json(
        {
          message: "النشاط غير موجود.",
        },
        { status: 404 },
      ),
    };
  }

  const isOwner = business.ownerId === session.user.id;
  const isAdmin =
    session.user.role === "ADMIN" ||
    session.user.role === "SUPER_ADMIN";

  if (!isOwner && !isAdmin) {
    return {
      error: NextResponse.json(
        {
          message: "ليس لديك صلاحية تعديل موقع هذا النشاط.",
        },
        { status: 403 },
      ),
    };
  }

  return { session, business };
}

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const business = await prisma.business.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        locations: {
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
          select: {
            id: true,
            address: true,
            city: true,
            district: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        {
          message: "النشاط غير موجود.",
        },
        { status: 404 },
      );
    }

    const location = business.locations[0] ?? null;

    return NextResponse.json({
      success: true,
      location: location
        ? {
            ...location,
            latitude: location.latitude
              ? Number(location.latitude)
              : null,
            longitude: location.longitude
              ? Number(location.longitude)
              : null,
          }
        : null,
    });
  } catch (error) {
    console.error("GET /api/admin/businesses/[id]/location error:", error);

    return NextResponse.json(
      {
        message: "حدث خطأ أثناء جلب الموقع.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const authorization = await getAuthorizedBusiness(id);

    if (authorization.error) {
      return authorization.error;
    }

    const body = await request.json();
    const parsed = locationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "بيانات الموقع غير صحيحة.",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { latitude, longitude } = parsed.data;

    const existingLocation = await prisma.location.findFirst({
      where: {
        businessId: id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const location = existingLocation
      ? await prisma.location.update({
          where: {
            id: existingLocation.id,
          },
          data: {
            latitude,
            longitude,
          },
        })
      : await prisma.location.create({
          data: {
            businessId: id,
            latitude,
            longitude,
          },
        });

    return NextResponse.json({
      success: true,
      message: "تم حفظ موقع النشاط بنجاح.",
      location: {
        id: location.id,
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
      },
    });
  } catch (error) {
    console.error("PUT /api/admin/businesses/[id]/location error:", error);

    return NextResponse.json(
      {
        message: "حدث خطأ أثناء حفظ الموقع.",
      },
      { status: 500 },
    );
  }
}
