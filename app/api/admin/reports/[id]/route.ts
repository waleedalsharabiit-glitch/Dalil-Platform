
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const schema = z.object({
  status: z.enum([
    "PENDING",
    "REVIEWED",
    "RESOLVED",
    "REJECTED",
  ]),
});

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
  request: Request,
  { params }: Props,
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

    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "غير مصرح.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();

    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "حالة البلاغ غير صحيحة.",
        },
        { status: 400 },
      );
    }

    const report = await prisma.report.findUnique({
      where: {
        id,
      },
    });

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          message: "البلاغ غير موجود.",
        },
        { status: 404 },
      );
    }

    const updated = await prisma.report.update({
      where: {
        id,
      },
      data: {
        status: parsed.data.status,
      },
    });

    await prisma.notification.create({
      data: {
        userId: report.reporterId,
        type: "SYSTEM",
        title: "تحديث البلاغ",
        message: `تم تحديث حالة البلاغ إلى ${parsed.data.status}.`,
        link: "/dashboard/notifications",
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث البلاغ.",
      report: updated,
    });
  } catch (error) {
    console.error("UPDATE_REPORT_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "تعذر تحديث البلاغ.",
      },
      { status: 500 },
    );
  }
}
