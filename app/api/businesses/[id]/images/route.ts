
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import {
  deleteStoredBusinessImageFiles,
  processBusinessImageUpload,
} from "@/lib/storage/business-image-storage";

class ImageLimitError extends Error {}

const imageSchema = z.object({
  url: z
    .string()
    .trim()
    .url("رابط الصورة غير صالح")
    .refine((value) => {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    }, "يجب أن يبدأ رابط الصورة بـ http أو https")
    .max(2000, "رابط الصورة طويل جدًا"),
  altText: z
    .string()
    .trim()
    .max(300, "النص البديل طويل جدًا")
    .nullable()
    .optional(),
});

async function getAuthorizedBusiness(
  businessId: string,
  userId: string,
  role: string,
) {
  const business = await prisma.business.findUnique({
    where: {
      id: businessId,
    },
    select: {
      id: true,
      ownerId: true,
    },
  });

  if (!business) {
    return null;
  }

  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isOwner = business.ownerId === userId;

  if (!isAdmin && !isOwner) {
    return "FORBIDDEN";
  }

  return business;
}

const imageOrderSchema = z.object({
  imageIds: z
    .array(z.string().min(1))
    .min(1)
    .max(20)
    .refine((ids) => new Set(ids).size === ids.length),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "غير مصرح لك بالدخول" },
        { status: 401 },
      );
    }

    const authorization = await getAuthorizedBusiness(
      id,
      session.user.id,
      session.user.role,
    );

    if (!authorization) {
      return NextResponse.json(
        { message: "النشاط غير موجود" },
        { status: 404 },
      );
    }

    if (authorization === "FORBIDDEN") {
      return NextResponse.json(
        { message: "ليس لديك صلاحية لعرض صور هذا النشاط" },
        { status: 403 },
      );
    }

    const business = await prisma.business.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        images: {
          orderBy: [
            {
              sortOrder: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { message: "النشاط غير موجود" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
      },
      images: business.images,
    });
  } catch (error) {
    console.error("GET /api/businesses/[id]/images error:", error);

    return NextResponse.json(
      { message: "حدث خطأ أثناء تحميل الصور" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "يجب تسجيل الدخول أولًا" },
        { status: 401 },
      );
    }

    const authorization = await getAuthorizedBusiness(
      id,
      session.user.id,
      session.user.role,
    );

    if (!authorization) {
      return NextResponse.json(
        { message: "النشاط غير موجود" },
        { status: 404 },
      );
    }

    if (authorization === "FORBIDDEN") {
      return NextResponse.json(
        { message: "ليس لديك صلاحية لترتيب صور هذا النشاط" },
        { status: 403 },
      );
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = imageOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "ترتيب الصور غير صحيح" },
        { status: 400 },
      );
    }

    const existingImages = await prisma.businessImage.findMany({
      where: { businessId: id },
      select: { id: true },
    });
    const existingIds = new Set(existingImages.map((image) => image.id));

    if (
      existingIds.size !== parsed.data.imageIds.length ||
      parsed.data.imageIds.some((imageId) => !existingIds.has(imageId))
    ) {
      return NextResponse.json(
        { message: "تحقق من الصور المرسلة ثم حاول مجددًا" },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const [sortOrder, imageId] of parsed.data.imageIds.entries()) {
        await tx.businessImage.updateMany({
          where: { id: imageId, businessId: id },
          data: { sortOrder },
        });
      }
    });

    return NextResponse.json({ message: "تم حفظ ترتيب الصور" });
  } catch (error) {
    console.error("PUT /api/businesses/[id]/images error:", error);

    return NextResponse.json(
      { message: "حدث خطأ أثناء ترتيب الصور" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "يجب تسجيل الدخول أولًا" },
        { status: 401 },
      );
    }

    const business = await getAuthorizedBusiness(
      id,
      session.user.id,
      session.user.role,
    );

    if (!business) {
      return NextResponse.json(
        { message: "النشاط غير موجود" },
        { status: 404 },
      );
    }

    if (business === "FORBIDDEN") {
      return NextResponse.json(
        { message: "ليس لديك صلاحية لإدارة صور هذا النشاط" },
        { status: 403 },
      );
    }

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const uploadedFiles = formData
        .getAll("files")
        .filter((value): value is File => value instanceof File);

      if (!uploadedFiles.length) {
        return NextResponse.json(
          { message: "يرجى اختيار صورة واحدة على الأقل" },
          { status: 400 },
        );
      }

      const altText = formData.get("altText")?.toString() ?? null;

      const existingCount = await prisma.businessImage.count({
        where: { businessId: id },
      });

      if (existingCount + uploadedFiles.length > 20) {
        throw new ImageLimitError();
      }

      const businessCategoryNames = await prisma.business.findUnique({
        where: { id },
        select: {
          categories: {
            select: {
              category: {
                select: { name: true },
              },
            },
          },
        },
      });

      const processedImages = await Promise.all(
        uploadedFiles.map((file) =>
          processBusinessImageUpload({
            file,
            businessId: id,
            altText: altText ?? undefined,
            categoryName:
              businessCategoryNames?.categories[0]?.category?.name ?? null,
          }),
        ),
      );

      const images = await prisma.$transaction(async (tx) => {
        const hasExistingPrimary = await tx.businessImage.count({
          where: {
            businessId: id,
            isPrimary: true,
          },
        });

        const createdImages = await Promise.all(
          processedImages.map(async (processedImage, index) => {
            const isPrimary = hasExistingPrimary === 0 && index === 0;

            return tx.businessImage.create({
              data: {
                businessId: id,
                url: processedImage.url,
                altText: processedImage.altText,
                sortOrder: existingCount + index,
                isPrimary,
              },
            });
          }),
        );

        return createdImages;
      });

      return NextResponse.json(
        {
          message: `تم رفع ${images.length} صورة بنجاح`,
          images,
        },
        { status: 201 },
      );
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = imageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "بيانات الصورة غير صحيحة",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const image = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Business" WHERE "id" = ${id} FOR UPDATE`;

      const imageCount = await tx.businessImage.count({
        where: { businessId: id },
      });

      if (imageCount >= 20) {
        throw new ImageLimitError();
      }

      const shouldBePrimary = imageCount === 0;

      return tx.businessImage.create({
        data: {
          businessId: id,
          url: data.url,
          altText: data.altText?.trim() || null,
          sortOrder: imageCount,
          isPrimary: shouldBePrimary,
        },
      });
    });

    return NextResponse.json(
      {
        message: "تمت إضافة الصورة بنجاح",
        image,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ImageLimitError) {
      return NextResponse.json(
        { message: "يمكنك إضافة 20 صورة كحد أقصى للنشاط" },
        { status: 400 },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "بيانات الصورة غير صحيحة",
          errors: error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    console.error("POST /api/businesses/[id]/images error:", error);

    return NextResponse.json(
      { message: "حدث خطأ أثناء إضافة الصورة" },
      { status: 500 },
    );
  }
}
