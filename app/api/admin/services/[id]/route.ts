
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const updateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "اسم الخدمة يجب أن يكون حرفين على الأقل")
    .max(120, "اسم الخدمة طويل جدًا"),

  slug: z
    .string()
    .trim()
    .max(150, "الرابط المختصر طويل جدًا")
    .optional(),

  description: z
    .string()
    .trim()
    .max(1000, "الوصف طويل جدًا")
    .nullable()
    .optional(),

  categoryId: z
    .string()
    .trim()
    .min(1, "يجب اختيار التصنيف"),

  isActive: z.boolean().optional(),
});

function createSlug(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[\u200C\u200D\uFEFF]/g, "")
    .replace(/[^\p{L}\p{N}\s-]+/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      authorized: false,
      status: 401,
      message: "يجب تسجيل الدخول.",
    };
  }

  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "SUPER_ADMIN"
  ) {
    return {
      authorized: false,
      status: 403,
      message: "ليس لديك صلاحية إدارة الخدمات.",
    };
  }

  return {
    authorized: true,
  };
}

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  const permission = await requireAdmin();

  if (!permission.authorized) {
    return NextResponse.json(
      {
        success: false,
        message: permission.message,
      },
      { status: permission.status },
    );
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateSchema.parse(body);

    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json(
        {
          success: false,
          message: "الخدمة غير موجودة.",
        },
        { status: 404 },
      );
    }

    const category = await prisma.category.findUnique({
      where: {
        id: data.categoryId,
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "التصنيف المحدد غير موجود.",
        },
        { status: 404 },
      );
    }

    const slug = data.slug?.trim()
      ? createSlug(data.slug)
      : existingService.slug;

    const duplicate = await prisma.service.findFirst({
      where: {
        slug,
        NOT: {
          id,
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message: "هذا الرابط المختصر مستخدم بالفعل.",
        },
        { status: 409 },
      );
    }

    const service = await prisma.service.update({
      where: {
        id,
      },
      data: {
        name: data.name.trim(),
        slug,
        description: data.description?.trim() || null,
        categoryId: data.categoryId,
        ...(data.isActive !== undefined
          ? {
              isActive: data.isActive,
            }
          : {}),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            businesses: true,
            requests: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث الخدمة بنجاح.",
      service,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.issues[0]?.message || "بيانات غير صحيحة.",
        },
        { status: 400 },
      );
    }

    console.error("UPDATE_SERVICE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء تحديث الخدمة.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  const permission = await requireAdmin();

  if (!permission.authorized) {
    return NextResponse.json(
      {
        success: false,
        message: permission.message,
      },
      { status: permission.status },
    );
  }

  const { id } = await params;

  try {
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            businesses: true,
            requests: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          message: "الخدمة غير موجودة.",
        },
        { status: 404 },
      );
    }

    if (service._count.businesses > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لا يمكن حذف هذه الخدمة لأنها مرتبطة بأنشطة. قم بتعطيلها بدلًا من حذفها.",
        },
        { status: 409 },
      );
    }

    if (service._count.requests > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لا يمكن حذف هذه الخدمة لأنها مرتبطة بطلبات. قم بتعطيلها بدلًا من حذفها.",
        },
        { status: 409 },
      );
    }

    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "تم حذف الخدمة بنجاح.",
    });
  } catch (error) {
    console.error("DELETE_SERVICE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء حذف الخدمة.",
      },
      { status: 500 },
    );
  }
}
