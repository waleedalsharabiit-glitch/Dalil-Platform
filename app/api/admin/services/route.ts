
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const serviceSchema = z.object({
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

export async function GET() {
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

  const services = await prisma.service.findMany({
    orderBy: {
      createdAt: "desc",
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
    services,
  });
}

export async function POST(request: Request) {
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

  try {
    const body = await request.json();
    const data = serviceSchema.parse(body);

    const category = await prisma.category.findUnique({
      where: {
        id: data.categoryId,
      },
      select: {
        id: true,
        isActive: true,
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
      : createSlug(data.name);

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message: "تعذر إنشاء الرابط المختصر للخدمة.",
        },
        { status: 400 },
      );
    }

    const existing = await prisma.service.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "هذا الرابط المختصر مستخدم بالفعل.",
        },
        { status: 409 },
      );
    }

    const service = await prisma.service.create({
      data: {
        name: data.name.trim(),
        slug,
        description: data.description?.trim() || null,
        categoryId: data.categoryId,
        isActive: data.isActive ?? true,
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

    return NextResponse.json(
      {
        success: true,
        message: "تم إنشاء الخدمة بنجاح.",
        service,
      },
      { status: 201 },
    );
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

    console.error("CREATE_SERVICE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء إنشاء الخدمة.",
      },
      { status: 500 },
    );
  }
}
