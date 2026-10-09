import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const updateCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "اسم التصنيف يجب أن يكون حرفين على الأقل")
    .max(100, "اسم التصنيف طويل جدًا"),

  slug: z
    .string()
    .trim()
    .max(120, "الرابط المختصر طويل جدًا")
    .optional(),

  description: z
    .string()
    .trim()
    .max(500, "الوصف طويل جدًا")
    .nullable()
    .optional(),

  icon: z
    .string()
    .trim()
    .max(100, "اسم الأيقونة طويل جدًا")
    .nullable()
    .optional(),

  image: z
    .string()
    .trim()
    .max(500, "رابط الصورة طويل جدًا")
    .nullable()
    .optional(),

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
      message: "ليس لديك صلاحية إدارة التصنيفات.",
    };
  }

  return {
    authorized: true,
    userId: session.user.id,
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
    const data = updateCategorySchema.parse(body);

    const existingCategory = await prisma.category.findUnique({
      where: {
        id,
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          message: "التصنيف غير موجود.",
        },
        { status: 404 },
      );
    }

    const slug = data.slug?.trim()
      ? createSlug(data.slug)
      : existingCategory.slug;

    const duplicate = await prisma.category.findFirst({
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

    const category = await prisma.category.update({
      where: {
        id,
      },
      data: {
        name: data.name.trim(),
        slug,
        description: data.description?.trim() || null,
        icon: data.icon?.trim() || null,
        image:
          data.image === undefined
            ? existingCategory.image
            : data.image == null
              ? null
              : data.image.trim() || null,
        ...(data.isActive !== undefined
          ? {
              isActive: data.isActive,
            }
          : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث التصنيف بنجاح.",
      category,
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

    console.error("UPDATE_CATEGORY_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء تحديث التصنيف.",
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
    const category = await prisma.category.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            businesses: true,
            services: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "التصنيف غير موجود.",
        },
        { status: 404 },
      );
    }

    if (category._count.businesses > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لا يمكن حذف التصنيف لأنه مرتبط بأنشطة. يمكنك تعطيله بدلًا من حذفه.",
        },
        { status: 409 },
      );
    }

    if (category._count.services > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "لا يمكن حذف التصنيف لأنه يحتوي على خدمات. يمكنك تعطيله بدلًا من حذفه.",
        },
        { status: 409 },
      );
    }

    await prisma.category.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم حذف التصنيف بنجاح.",
    });
  } catch (error) {
    console.error("DELETE_CATEGORY_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء حذف التصنيف.",
      },
      { status: 500 },
    );
  }
}