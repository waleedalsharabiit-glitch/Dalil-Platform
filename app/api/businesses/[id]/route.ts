
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

interface BusinessRouteProps {
  params: Promise<{
    id: string;
  }>;
}

const updateBusinessSchema = z.object({
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
  )
  .optional(),

 description: z
  .string()
  .trim()
  .max(2000, "الوصف طويل جدًا")
  .nullable()
  .optional(),

phone: z
  .string()
  .trim()
  .max(30, "رقم الهاتف طويل جدًا")
  .nullable()
  .optional(),

whatsapp: z
  .string()
  .trim()
  .max(30, "رقم WhatsApp طويل جدًا")
  .nullable()
  .optional(),

website: z
  .string()
  .trim()
  .url("رابط الموقع غير صحيح")
  .max(300)
  .nullable()
  .optional(),

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

async function getAuthorizedBusiness(id: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "يجب تسجيل الدخول أولًا.",
        },
        { status: 401 },
      ),
    };
  }

  const isAdmin =
    session.user.role === "ADMIN" ||
    session.user.role === "SUPER_ADMIN";

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      services: {
        include: {
          service: {
            include: {
              category: true,
            },
          },
        },
      },
      locations: {
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
      },
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      hours: {
        orderBy: {
          dayOfWeek: "asc",
        },
      },
      _count: {
        select: {
          reviews: {
            where: {
              isPublished: true,
            },
          },
          favorites: true,
          requests: true,
        },
      },
    },
  });

  if (!business) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "النشاط التجاري غير موجود.",
        },
        { status: 404 },
      ),
    };
  }

  if (!isAdmin && business.ownerId !== session.user.id) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "ليس لديك صلاحية الوصول إلى هذا النشاط.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    session,
    business,
    isAdmin,
  };
}

export async function GET(
  _request: Request,
  { params }: BusinessRouteProps,
) {
  try {
    const { id } = await params;

    const result = await getAuthorizedBusiness(id);

    if ("error" in result) {
      return result.error;
    }

    return NextResponse.json({
      success: true,
      business: result.business,
    });
  } catch (error) {
    console.error("Get business failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء جلب بيانات النشاط.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: BusinessRouteProps,
) {
  try {
    const { id } = await params;

    const result = await getAuthorizedBusiness(id);

    if ("error" in result) {
      return result.error;
    }

    const { business, isAdmin } = result;

    const body = await request.json();

    const parsed = updateBusinessSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            parsed.error.issues[0]?.message ??
            "بيانات غير صحيحة.",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = parsed.data;

   const normalizedSlug = data.slug
  ? data.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-{2,}/g, "-")
  : business.slug;

if (!normalizedSlug) {
  return NextResponse.json(
    {
      success: false,
      message: "الرابط المختصر غير صالح.",
    },
    { status: 400 },
  );
}

    const duplicateSlug = await prisma.business.findFirst({
      where: {
        slug: normalizedSlug,
        NOT: {
          id,
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicateSlug) {
      return NextResponse.json(
        {
          success: false,
          message:
            "هذا الرابط المختصر مستخدم بالفعل. اختر رابطًا آخر.",
        },
        { status: 409 },
      );
    }

    const uniqueCategoryIds = [
      ...new Set(data.categoryIds),
    ];

    const categories = await prisma.category.findMany({
      where: {
        id: {
          in: uniqueCategoryIds,
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (
      categories.length !== uniqueCategoryIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "يوجد تصنيف غير صالح أو غير متاح.",
        },
        { status: 400 },
      );
    }

    const uniqueServiceIds = [
      ...new Set(data.serviceIds),
    ];

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

    if (
      services.length !== uniqueServiceIds.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "يوجد خدمة غير صالحة أو غير متاحة.",
        },
        { status: 400 },
      );
    }

    const hasLocation =
      Boolean(data.address?.trim()) ||
      Boolean(data.city?.trim()) ||
      Boolean(data.district?.trim()) ||
      data.latitude != null ||
      data.longitude != null;

    const updatedBusiness = await prisma.$transaction(
      async (tx) => {
        const updated = await tx.business.update({
          where: {
            id,
          },
          data: {
            name: data.name,
            slug: normalizedSlug,
            description:
              data.description?.trim() || null,
            phone: data.phone?.trim() || null,
            whatsapp:
              data.whatsapp?.trim() || null,
            website:
              data.website?.trim() || null,

            categories: {
              deleteMany: {},
              create: uniqueCategoryIds.map(
                (categoryId) => ({
                  categoryId,
                }),
              ),
            },

            services: {
              deleteMany: {},
              create: uniqueServiceIds.map(
                (serviceId) => ({
                  serviceId,
                }),
              ),
            },
          },
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            isVerified: true,
          },
        });

        const location =
          await tx.location.findFirst({
            where: {
              businessId: id,
            },
            orderBy: {
              createdAt: "asc",
            },
          });

        if (hasLocation) {
          if (location) {
            await tx.location.update({
              where: {
                id: location.id,
              },
              data: {
                address:
                  data.address?.trim() || null,
                city:
                  data.city?.trim() || null,
                district:
                  data.district?.trim() || null,
                latitude:
                  data.latitude ?? null,
                longitude:
                  data.longitude ?? null,
              },
            });
          } else {
            await tx.location.create({
              data: {
                businessId: id,
                address:
                  data.address?.trim() || null,
                city:
                  data.city?.trim() || null,
                district:
                  data.district?.trim() || null,
                latitude:
                  data.latitude ?? null,
                longitude:
                  data.longitude ?? null,
              },
            });
          }
        } else if (location) {
          await tx.location.delete({
            where: {
              id: location.id,
            },
          });
        }

        return updated;
      },
    );

    return NextResponse.json({
      success: true,
      message: isAdmin
        ? "تم تحديث النشاط بنجاح."
        : "تم تحديث النشاط بنجاح وسيبقى خاضعًا للمراجعة حسب حالته.",
      business: updatedBusiness,
    });
  } catch (error) {
    console.error("Update business failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء تحديث النشاط.",
      },
      { status: 500 },
    );
  }
}
