
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const schema = z
  .object({
    type: z.enum(["BUSINESS", "REVIEW", "USER"]),
    reason: z.string().trim().min(3).max(200),
    details: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .or(z.literal("")),
    businessId: z.string().optional(),
    reviewId: z.string().optional(),
    reportedUserId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.type === "BUSINESS" &&
      !data.businessId
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["businessId"],
        message: "معرف النشاط مطلوب.",
      });
    }

    if (
      data.type === "REVIEW" &&
      !data.reviewId
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewId"],
        message: "معرف التقييم مطلوب.",
      });
    }

    if (
      data.type === "USER" &&
      !data.reportedUserId
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["reportedUserId"],
        message: "معرف المستخدم مطلوب.",
      });
    }
  });

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "يجب تسجيل الدخول لإرسال بلاغ.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            parsed.error.issues[0]?.message ??
            "بيانات البلاغ غير صحيحة.",
        },
        { status: 400 },
      );
    }

    if (
      parsed.data.type === "USER" &&
      parsed.data.reportedUserId === session.user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "لا يمكنك الإبلاغ عن نفسك.",
        },
        { status: 400 },
      );
    }

    const report = await prisma.report.create({
      data: {
        type: parsed.data.type,
        reason: parsed.data.reason,
        details:
          parsed.data.details || null,
        reporterId: session.user.id,
        businessId:
          parsed.data.type === "BUSINESS"
            ? parsed.data.businessId
            : null,
        reviewId:
          parsed.data.type === "REVIEW"
            ? parsed.data.reviewId
            : null,
        reportedUserId:
          parsed.data.type === "USER"
            ? parsed.data.reportedUserId
            : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "تم إرسال البلاغ وسيتم مراجعته من الإدارة.",
        report,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE_REPORT_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "تعذر إرسال البلاغ.",
      },
      { status: 500 },
    );
  }
}
