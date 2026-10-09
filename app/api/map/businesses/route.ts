import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const businesses = await prisma.business.findMany({
      where: {
        status: "ACTIVE",
        locations: {
          some: {
            latitude: {
              not: null,
            },
            longitude: {
              not: null,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isVerified: true,
        images: {
          where: {
            isPrimary: true,
          },
          take: 1,
          select: {
            url: true,
            altText: true,
          },
        },
        categories: {
          take: 2,
          select: {
            category: {
              select: {
                name: true,
              },
            },
          },
        },
        locations: {
          where: {
            latitude: {
              not: null,
            },
            longitude: {
              not: null,
            },
          },
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
          select: {
            latitude: true,
            longitude: true,
            city: true,
            district: true,
            address: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const result = businesses
      .map((business) => {
        const location = business.locations[0];

        if (!location?.latitude || !location?.longitude) {
          return null;
        }

        return {
          id: business.id,
          name: business.name,
          slug: business.slug,
          description: business.description,
          isVerified: business.isVerified,
          latitude: Number(location.latitude),
          longitude: Number(location.longitude),
          city: location.city,
          district: location.district,
          address: location.address,
          image: business.images[0]?.url ?? null,
          categories: business.categories.map(
            (item) => item.category.name,
          ),
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      businesses: result,
    });
  } catch (error) {
    console.error("GET /api/map/businesses error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "تعذر تحميل الأنشطة على الخريطة.",
      },
      { status: 500 },
    );
  }
}
