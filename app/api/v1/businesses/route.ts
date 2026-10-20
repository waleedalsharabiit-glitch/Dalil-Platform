import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getMobileApiUser } from "@/lib/auth/mobile-api-user";
import { mobileApiErrorResponse } from "@/lib/api/mobile-response";

const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  city: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: Request) {
  try {
    await getMobileApiUser(request);
  } catch (error) {
    return mobileApiErrorResponse(error);
  }
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: { message: "معاملات البحث غير صالحة" } }, { status: 400 });
  const { q, city, category, page, limit } = parsed.data;
  const where = {
    status: "ACTIVE" as const,
    ...(q ? { OR: [
      { name: { contains: q, mode: "insensitive" as const } },
      { description: { contains: q, mode: "insensitive" as const } },
      { services: { some: { service: { name: { contains: q, mode: "insensitive" as const } } } } },
    ] } : {}),
    ...(city ? { locations: { some: { city: { contains: city, mode: "insensitive" as const } } } } : {}),
    ...(category ? { categories: { some: { category: { OR: [
      { name: { contains: category, mode: "insensitive" as const } },
      { slug: { contains: category, mode: "insensitive" as const } },
    ] } } } } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.business.count({ where }),
    prisma.business.findMany({
      where,
      orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, slug: true, description: true, phone: true, whatsapp: true, website: true, isVerified: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true, altText: true } },
        locations: { take: 1, select: { address: true, city: true, district: true, latitude: true, longitude: true } },
        categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
        services: { select: { service: { select: { id: true, name: true, slug: true } } } },
      },
    }),
  ]);
  return NextResponse.json({ data: rows.map(({ images, locations, categories, services, ...item }) => ({
    ...item, image: images[0] ?? null, location: locations[0] ?? null,
    categories: categories.map(({ category: value }) => value), services: services.map(({ service }) => service),
  })), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

const createBusinessSchema = z.object({
  name: z.string().trim().min(2, "اسم النشاط يجب أن يكون حرفين على الأقل").max(120, "اسم النشاط طويل جدًا"),
  slug: z.string().trim().min(2, "الرابط المختصر يجب أن يكون حرفين على الأقل").max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "الرابط المختصر يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطات فقط"),
  description: z.string().trim().max(2000, "الوصف طويل جدًا").optional().or(z.literal("")),
  phone: z.string().trim().max(30, "رقم الهاتف طويل جدًا").optional().or(z.literal("")),
  whatsapp: z.string().trim().max(30, "رقم WhatsApp طويل جدًا").optional().or(z.literal("")),
  website: z.string().trim().url("رابط الموقع غير صحيح").max(300).optional().or(z.literal("")),
  categoryIds: z.array(z.string().min(1)).min(1, "اختر تصنيفًا واحدًا على الأقل"),
  serviceIds: z.array(z.string()).default([]),
  address: z.string().trim().max(300, "العنوان طويل جدًا").optional().or(z.literal("")),
  city: z.string().trim().max(100, "اسم المدينة طويل جدًا").optional().or(z.literal("")),
  district: z.string().trim().max(100, "اسم المنطقة طويل جدًا").optional().or(z.literal("")),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

function normalizeBusinessSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
}

export async function POST(request: Request) {
  try {
    const user = await getMobileApiUser(request);
    if (user.role !== "BUSINESS_OWNER") {
      return NextResponse.json({ success: false, message: "ليس لديك صلاحية لإنشاء نشاط تجاري." }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "بيانات الطلب غير صالحة." }, { status: 400 });
    }

    const parsed = createBusinessSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة." }, { status: 400 });
    }

    const data = parsed.data;
    const slug = normalizeBusinessSlug(data.slug);
    if (!slug) return NextResponse.json({ success: false, message: "الرابط المختصر غير صالح." }, { status: 400 });

    const duplicate = await prisma.business.findUnique({ where: { slug }, select: { id: true } });
    if (duplicate) return NextResponse.json({ success: false, message: "هذا الرابط المختصر مستخدم بالفعل. اختر رابطًا آخر." }, { status: 409 });

    const categoryIds = [...new Set(data.categoryIds)];
    const categories = await prisma.category.findMany({ where: { id: { in: categoryIds }, isActive: true }, select: { id: true } });
    if (categories.length !== categoryIds.length) {
      return NextResponse.json({ success: false, message: "يوجد تصنيف غير صالح أو غير متاح." }, { status: 400 });
    }

    const serviceIds = [...new Set(data.serviceIds)];
    const services = serviceIds.length
      ? await prisma.service.findMany({ where: { id: { in: serviceIds }, isActive: true }, select: { id: true, categoryId: true } })
      : [];
    if (services.length !== serviceIds.length) {
      return NextResponse.json({ success: false, message: "يوجد خدمة غير صالحة أو غير متاحة." }, { status: 400 });
    }
    if (services.some((service) => !categoryIds.includes(service.categoryId))) {
      return NextResponse.json({ success: false, message: "يجب أن تتبع الخدمات المختارة تصنيفًا محددًا للنشاط." }, { status: 400 });
    }

    const business = await prisma.$transaction(async (tx) => {
      const created = await tx.business.create({
        data: {
          name: data.name,
          slug,
          description: data.description || null,
          phone: data.phone || null,
          whatsapp: data.whatsapp || null,
          website: data.website || null,
          ownerId: user.id,
          status: "PENDING",
          isVerified: false,
          categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
          services: { create: serviceIds.map((serviceId) => ({ serviceId })) },
        },
        select: { id: true, slug: true, name: true, status: true },
      });

      const hasLocation = Boolean(data.address?.trim() || data.city?.trim() || data.district?.trim()) || data.latitude != null || data.longitude != null;
      if (hasLocation) {
        await tx.location.create({
          data: {
            businessId: created.id,
            address: data.address || null,
            city: data.city || null,
            district: data.district || null,
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null,
          },
        });
      }
      return created;
    });

    return NextResponse.json({
      success: true,
      message: "تم إرسال النشاط التجاري بنجاح، وسيتم مراجعته قبل نشره.",
      business,
    }, { status: 201 });
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: string }).code
      : undefined;
    if (code === "P2002") {
      return NextResponse.json({ success: false, message: "هذا الرابط المختصر مستخدم بالفعل. اختر رابطًا آخر." }, { status: 409 });
    }
    return mobileApiErrorResponse(error);
  }
}
