
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { deleteStoredBusinessImageFiles } from "@/lib/storage/business-image-storage";

const updateImageSchema = z.object({
  altText: z
    .string()
    .trim()
    .max(300, "النص البديل طويل جدًا")
    .nullable()
    .optional(),

  isPrimary: z.boolean().optional(),

  sortOrder: z
    .number()
    .int()
    .min(0)
    .max(100)
    .optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "أرسل حقلًا واحدًا على الأقل للتحديث",
});

async function authorize(
  businessId: string,
  imageId: string,
  userId: string,
  role: string,
) {
  const image = await prisma.businessImage.findFirst({
    where: {
      id: imageId,
      businessId,
    },
    select: {
      id: true,
      businessId: true,
      isPrimary: true,
    },
  });

  if (!image) {
    return null;
  }

  const business = await prisma.business.findUnique({
    where: {
      id: businessId,
    },
    select: {
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

  return image;
}

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      imageId: string;
    }>;
  },
) {
  try {
    const session = await auth();
    const { id, imageId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "يجب تسجيل الدخول أولًا" },
        { status: 401 },
      );
    }

    const image = await authorize(
      id,
      imageId,
      session.user.id,
      session.user.role,
    );

    if (!image) {
      return NextResponse.json(
        { message: "الصورة غير موجودة" },
        { status: 404 },
      );
    }

    if (image === "FORBIDDEN") {
      return NextResponse.json(
        { message: "ليس لديك صلاحية لتعديل هذه الصورة" },
        { status: 403 },
      );
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = updateImageSchema.safeParse(body);

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

    if (data.isPrimary === false) {
      return NextResponse.json(
        { message: "اختر صورة أخرى كرئيسية بدل إزالة الصورة الرئيسية" },
        { status: 400 },
      );
    }

    const updatedImage = await prisma.$transaction(async (tx) => {
      if (data.isPrimary === true) {
        await tx.businessImage.updateMany({
          where: {
            businessId: id,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      return tx.businessImage.update({
        where: {
          id: imageId,
        },
        data: {
          ...(data.altText !== undefined
            ? {
                altText: data.altText?.trim() || null,
              }
            : {}),

          ...(data.sortOrder !== undefined
            ? {
                sortOrder: data.sortOrder,
              }
            : {}),

          ...(data.isPrimary !== undefined
            ? {
                isPrimary: data.isPrimary,
              }
            : {}),
        },
      });
    });

    return NextResponse.json({
      message: "تم تحديث الصورة بنجاح",
      image: updatedImage,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "بيانات الصورة غير صحيحة",
          errors: error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    console.error(
      "PATCH /api/businesses/[id]/images/[imageId] error:",
      error,
    );

    return NextResponse.json(
      { message: "حدث خطأ أثناء تحديث الصورة" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
      imageId: string;
    }>;
  },
) {
  try {
    const session = await auth();
    const { id, imageId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "يجب تسجيل الدخول أولًا" },
        { status: 401 },
      );
    }

    const image = await authorize(
      id,
      imageId,
      session.user.id,
      session.user.role,
    );

    if (!image) {
      return NextResponse.json(
        { message: "الصورة غير موجودة" },
        { status: 404 },
      );
    }

    if (image === "FORBIDDEN") {
      return NextResponse.json(
        { message: "ليس لديك صلاحية لحذف هذه الصورة" },
        { status: 403 },
      );
    }

    const imageToDelete = await prisma.businessImage.findUnique({
      where: { id: imageId },
      select: { url: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.businessImage.delete({
        where: {
          id: imageId,
        },
      });

      const remainingImages = await tx.businessImage.findMany({
        where: {
          businessId: id,
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      });

      if (remainingImages.length > 0) {
        const hasPrimary = remainingImages.some(
          (item) => item.isPrimary,
        );

        if (!hasPrimary) {
          await tx.businessImage.update({
            where: {
              id: remainingImages[0].id,
            },
            data: {
              isPrimary: true,
            },
          });
        }

        for (let index = 0; index < remainingImages.length; index++) {
          await tx.businessImage.update({
            where: {
              id: remainingImages[index].id,
            },
            data: {
              sortOrder: index,
            },
          });
        }
      }
    });

    if (imageToDelete?.url) {
      await deleteStoredBusinessImageFiles(imageToDelete.url);
    }

    return NextResponse.json({
      message: "تم حذف الصورة بنجاح",
    });
  } catch (error) {
    console.error(
      "DELETE /api/businesses/[id]/images/[imageId] error:",
      error,
    );

    return NextResponse.json(
      { message: "حدث خطأ أثناء حذف الصورة" },
      { status: 500 },
    );
  }
}
