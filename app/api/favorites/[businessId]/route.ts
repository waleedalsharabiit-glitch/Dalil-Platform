
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
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

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        business: {
          include: {
            images: {
              orderBy: {
                sortOrder: "asc",
              },
              take: 1,
            },
            locations: {
              take: 1,
            },
            categories: {
              include: {
                category: true,
              },
              take: 3,
            },
            _count: {
              select: {
                reviews: true,
                favorites: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      favorites,
    });
  } catch (error) {
    console.error("GET_FAVORITES_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "تعذر تحميل المفضلة.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "يجب تسجيل الدخول لإضافة نشاط إلى المفضلة.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const businessId =
      typeof body.businessId === "string"
        ? body.businessId.trim()
        : "";

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          message: "معرف النشاط مطلوب.",
        },
        { status: 400 },
      );
    }

    const business = await prisma.business.findUnique({
      where: {
        id: businessId,
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    if (!business || business.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "النشاط غير متاح.",
        },
        { status: 404 },
      );
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId,
        },
      },
      update: {},
      create: {
        userId: session.user.id,
        businessId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `تمت إضافة ${business.name} إلى المفضلة.`,
      favorite,
    });
  } catch (error) {
    console.error("ADD_FAVORITE_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "تعذر إضافة النشاط إلى المفضلة.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
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

    const body = await request.json();

    const businessId =
      typeof body.businessId === "string"
        ? body.businessId.trim()
        : "";

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          message: "معرف النشاط مطلوب.",
        },
        { status: 400 },
      );
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
        businessId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تمت إزالة النشاط من المفضلة.",
    });
  } catch (error) {
    console.error("DELETE_FAVORITE_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message: "تعذر إزالة النشاط من المفضلة.",
      },
      { status: 500 },
    );
  }
}
