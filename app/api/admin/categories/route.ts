import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const categorySchema = z.object({
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

function createSlug(name: string) {
  return name
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

  const categories = await prisma.category.findMany({
    orderBy: {
      createdAt: "desc",
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

  return NextResponse.json({
    success: true,
    categories,
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

    const data = categorySchema.parse(body);

    const slug =
      data.slug && data.slug.trim()
        ? createSlug(data.slug)
        : createSlug(data.name);

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message: "تعذر إنشاء الرابط المختصر للتصنيف.",
        },
        { status: 400 },
      );
    }

    const existingSlug = await prisma.category.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (existingSlug) {
      return NextResponse.json(
        {
          success: false,
          message: "هذا الرابط المختصر مستخدم بالفعل.",
        },
        { status: 409 },
      );
    }

    const category = await prisma.category.create({
      data: {
        name: data.name.trim(),
        slug,
        description: data.description?.trim() || null,
        icon: data.icon?.trim() || null,
        image: data.image?.trim() || null,
        isActive: data.isActive ?? true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "تم إنشاء التصنيف بنجاح.",
        category,
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

    console.error("CREATE_CATEGORY_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء إنشاء التصنيف.",
      },
      { status: 500 },
    );
  }
}