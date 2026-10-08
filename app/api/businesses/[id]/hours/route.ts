
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

import { DayOfWeek } from "@/generated/prisma/client";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

const daySchema = z.object({
  dayOfWeek: z.nativeEnum(DayOfWeek),
  opensAt: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "وقت الفتح غير صحيح"),
  closesAt: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "وقت الإغلاق غير صحيح"),
  isClosed: z.boolean(),
});

const hoursSchema = z.object({
  hours: z.array(daySchema).length(7),
});

async function getAuthorizedBusiness(userId: string, businessId: string) {
  const business = await prisma.business.findUnique({
    where: {
      id: businessId,
    },
    select: {
      id: true,
      ownerId: true,
      name: true,
    },
  });

  if (!business) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "النشاط غير موجود",
        },
        { status: 404 },
      ),
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      role: true,
    },
  });

  const isAdmin =
    user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  if (!isAdmin && business.ownerId !== userId) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "ليس لديك صلاحية إدارة هذا النشاط",
        },
        { status: 403 },
      ),
    };
  }

  return {
    business,
  };
}

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "غير مصرح",
        },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    const authorization = await getAuthorizedBusiness(
      session.user.id,
      id,
    );

    if (authorization.error) {
      return authorization.error;
    }

    const hours = await prisma.businessHours.findMany({
      where: {
        businessId: id,
      },
      orderBy: {
        dayOfWeek: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      hours,
    });
  } catch (error) {
    console.error("GET /api/businesses/[id]/hours:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء جلب ساعات العمل",
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
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "غير مصرح",
        },
        { status: 401 },
      );
    }

    const { id } = await context.params;

    const authorization = await getAuthorizedBusiness(
      session.user.id,
      id,
    );

    if (authorization.error) {
      return authorization.error;
    }

    const body = await request.json();

    const parsed = hoursSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "بيانات ساعات العمل غير صحيحة",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    for (const day of parsed.data.hours) {
      if (!day.isClosed && day.opensAt >= day.closesAt) {
        return NextResponse.json(
          {
            success: false,
            message: `وقت الإغلاق يجب أن يكون بعد وقت الفتح في ${day.dayOfWeek}`,
          },
          { status: 400 },
        );
      }
    }

    await prisma.$transaction(
      parsed.data.hours.map((day) =>
        prisma.businessHours.upsert({
          where: {
            businessId_dayOfWeek: {
              businessId: id,
              dayOfWeek: day.dayOfWeek,
            },
          },
          update: {
            opensAt: day.opensAt,
            closesAt: day.closesAt,
            isClosed: day.isClosed,
          },
          create: {
            businessId: id,
            dayOfWeek: day.dayOfWeek,
            opensAt: day.opensAt,
            closesAt: day.closesAt,
            isClosed: day.isClosed,
          },
        }),
      ),
    );

    const hours = await prisma.businessHours.findMany({
      where: {
        businessId: id,
      },
      orderBy: {
        dayOfWeek: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم حفظ ساعات العمل بنجاح",
      hours,
    });
  } catch (error) {
    console.error("PUT /api/businesses/[id]/hours:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء حفظ ساعات العمل",
      },
      { status: 500 },
    );
  }
}
