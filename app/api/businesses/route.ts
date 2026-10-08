
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const createBusinessSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "اسم النشاط يجب أن يكون حرفين على الأقل")
    .max(120, "اسم النشاط طويل جدًا"),

  slug: z
    .string()
    .trim()
    .min(2, "الرابط المختصر يجب أن يكون حرفين على الأقل")
    .max(120)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "الرابط المختصر يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطات فقط",
    ),

  description: z
    .string()
    .trim()
    .max(2000, "الوصف طويل جدًا")
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .trim()
    .max(30, "رقم الهاتف طويل جدًا")
    .optional()
    .or(z.literal("")),

  whatsapp: z
    .string()
    .trim()
    .max(30, "رقم WhatsApp طويل جدًا")
    .optional()
    .or(z.literal("")),

  website: z
    .string()
    .trim()
    .url("رابط الموقع غير صحيح")
    .max(300)
    .optional()
    .or(z.literal("")),

  categoryIds: z
    .array(z.string().min(1))
    .min(1, "اختر تصنيفًا واحدًا على الأقل"),

  serviceIds: z.array(z.string()).default([]),

  address: z
    .string()
    .trim()
    .max(300, "العنوان طويل جدًا")
    .optional()
    .or(z.literal("")),

  city: z
    .string()
    .trim()
    .max(100, "اسم المدينة طويل جدًا")
    .optional()
    .or(z.literal("")),

  district: z
    .string()
    .trim()
    .max(100, "اسم المنطقة طويل جدًا")
    .optional()
    .or(z.literal("")),

  latitude: z
    .number()
    .min(-90, "خط العرض غير صحيح")
    .max(90, "خط العرض غير صحيح")
    .nullable()
    .optional(),

  longitude: z
    .number()
    .min(-180, "خط الطول غير صحيح")
    .max(180, "خط الطول غير صحيح")
    .nullable()
    .optional(),
});

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "يجب تسجيل الدخول أولًا.",
        },
        { status: 401 },
      );
    }

    if (session.user.role !== "BUSINESS_OWNER") {
      return NextResponse.json(
        {
          success: false,
          message: "ليس لديك صلاحية لإنشاء نشاط تجاري.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const parsed = createBusinessSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة.",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const slug = normalizeSlug(data.slug);

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          message: "الرابط المختصر غير صالح.",
        },
        { status: 400 },
      );
    }

    const existingBusiness = await prisma.business.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (existingBusiness) {
      return NextResponse.json(
        {
          success: false,
          message: "هذا الرابط المختصر مستخدم بالفعل. اختر رابطًا آخر.",
        },
        { status: 409 },
      );
    }

    const categories = await prisma.category.findMany({
      where: {
        id: {
          in: data.categoryIds,
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (categories.length !== data.categoryIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "يوجد تصنيف غير صالح أو غير متاح.",
        },
        { status: 400 },
      );
    }

    const uniqueServiceIds = [...new Set(data.serviceIds)];

    const services = uniqueServiceIds.length
      ? await prisma.service.findMany({
          where: {
            id: {
              in: uniqueServiceIds,
            },
            isActive: true,
          },
          select: {
            id: true,
          },
        })
      : [];

    if (services.length !== uniqueServiceIds.length) {
      return NextResponse.json(
        {
          success: false,
          message: "يوجد خدمة غير صالحة أو غير متاحة.",
        },
        { status: 400 },
      );
    }

    const business = await prisma.$transaction(async (tx) => {
      const createdBusiness = await tx.business.create({
        data: {
          name: data.name,
          slug,
          description: data.description || null,
          phone: data.phone || null,
          whatsapp: data.whatsapp || null,
          website: data.website || null,
          ownerId: session.user.id,

          status: "PENDING",
          isVerified: false,

          categories: {
            create: data.categoryIds.map((categoryId) => ({
              categoryId,
            })),
          },

          services: {
            create: uniqueServiceIds.map((serviceId) => ({
              serviceId,
            })),
          },
        },
        select: {
          id: true,
          slug: true,
          name: true,
          status: true,
        },
      });

     
const hasLocation =
  Boolean(data.address?.trim()) ||
  Boolean(data.city?.trim()) ||
  Boolean(data.district?.trim()) ||
  data.latitude != null ||
  data.longitude != null;



      if (hasLocation) {
        await tx.location.create({
          data: {
            businessId: createdBusiness.id,
            address: data.address || null,
            city: data.city || null,
            district: data.district || null,
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null,
          },
        });
      }

      return createdBusiness;
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "تم إرسال النشاط التجاري بنجاح، وسيتم مراجعته قبل نشره.",
        business,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create business failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء إنشاء النشاط التجاري.",
      },
      { status: 500 },
    );
  }
}
