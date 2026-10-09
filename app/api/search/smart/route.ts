import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
import { parseSmartSearch } from "@/lib/search/smart-search";

const MAX_RESULTS = 100;
const DEFAULT_RADIUS_KM = 25;

function containsInsensitive(value: string): Prisma.StringFilter {
  return {
    contains: value,
    mode: "insensitive",
  };
}

function distanceInKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return (
    earthRadiusKm *
    2 *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") ?? "").trim();

    const latValue = url.searchParams.get("lat");
    const lngValue = url.searchParams.get("lng");
    const radiusValue = Number(
      url.searchParams.get("radius") ?? DEFAULT_RADIUS_KM,
    );

    const lat = latValue === null ? null : Number(latValue);
    const lng = lngValue === null ? null : Number(lngValue);

    const hasCoordinates =
      lat !== null &&
      lng !== null &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180;

    if ((latValue !== null || lngValue !== null) && !hasCoordinates) {
      return NextResponse.json(
        { success: false, message: "إحداثيات الموقع غير صحيحة." },
        { status: 400 },
      );
    }

    const intent = parseSmartSearch(query);
    const andConditions: Prisma.BusinessWhereInput[] = [];

    // نوع النشاط: مطعم، كمبيوتر، صيدلية، شبكات...
    if (intent.categoryKeywords.length > 0) {
      const categoryConditions: Prisma.BusinessWhereInput[] =
        intent.categoryKeywords.flatMap((keyword) => [
          {
            categories: {
              some: {
                category: {
                  name: containsInsensitive(keyword),
                },
              },
            },
          },
          {
            services: {
              some: {
                service: {
                  name: containsInsensitive(keyword),
                },
              },
            },
          },
          { name: containsInsensitive(keyword) },
          {
            description: containsInsensitive(keyword),
          },
        ]);

      andConditions.push({ OR: categoryConditions });
    }

    // المنطقة: المعلا، كريتر، المنصورة، وغيرها.
    if (intent.location) {
      andConditions.push({
        locations: {
          some: {
            OR: [
              { city: containsInsensitive(intent.location) },
              { district: containsInsensitive(intent.location) },
              { address: containsInsensitive(intent.location) },
            ],
          },
        },
      });
    }

    // كلمات المنتج أو الخدمة: SSD، 1TB، RAM، MikroTik...
    for (const term of intent.searchTerms) {
      andConditions.push({
        OR: [
          { name: containsInsensitive(term) },
          { description: containsInsensitive(term) },
          {
            categories: {
              some: {
                category: {
                  name: containsInsensitive(term),
                },
              },
            },
          },
          {
            services: {
              some: {
                service: {
                  name: containsInsensitive(term),
                },
              },
            },
          },
          {
            locations: {
              some: {
                OR: [
                  { address: containsInsensitive(term) },
                  { city: containsInsensitive(term) },
                  { district: containsInsensitive(term) },
                ],
              },
            },
          },
        ],
      });
    }

    const businesses = await prisma.business.findMany({
      where: {
        status: "ACTIVE",
        AND: andConditions,
      },
      take: MAX_RESULTS,
      orderBy: [
        { isVerified: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        phone: true,
        whatsapp: true,
        isVerified: true,
        categories: {
          select: {
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        services: {
          select: {
            service: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: {
            url: true,
            altText: true,
          },
        },
        locations: {
          orderBy: { createdAt: "asc" },
          take: 1,
          select: {
            address: true,
            city: true,
            district: true,
            latitude: true,
            longitude: true,
          },
        },
        reviews: {
          where: { isPublished: true },
          select: { rating: true },
        },
      },
    });

    const results = businesses.map((business) => {
      const location = business.locations[0] ?? null;

      const latitude =
        location?.latitude == null
          ? null
          : Number(location.latitude);

      const longitude =
        location?.longitude == null
          ? null
          : Number(location.longitude);

      const distanceKm =
        hasCoordinates &&
        latitude !== null &&
        longitude !== null
          ? distanceInKm(lat!, lng!, latitude, longitude)
          : null;

      const ratings = business.reviews.map((review) => review.rating);

      const averageRating =
        ratings.length > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) /
            ratings.length
          : null;

      return {
        id: business.id,
        name: business.name,
        slug: business.slug,
        description: business.description,
        phone: business.phone,
        whatsapp: business.whatsapp,
        isVerified: business.isVerified,
        image: business.images[0]?.url ?? null,
        categories: business.categories.map(
          (item) => item.category,
        ),
        services: business.services.map(
          (item) => item.service,
        ),
        location: location
          ? {
              address: location.address,
              city: location.city,
              district: location.district,
              latitude,
              longitude,
            }
          : null,
        distanceKm:
          distanceKm === null
            ? null
            : Math.round(distanceKm * 10) / 10,
        averageRating:
          averageRating === null
            ? null
            : Math.round(averageRating * 10) / 10,
        reviewCount: ratings.length,
      };
    });

    const radiusKm =
      Number.isFinite(radiusValue) &&
      radiusValue >= 1 &&
      radiusValue <= 100
        ? radiusValue
        : DEFAULT_RADIUS_KM;

    const nearbyResults =
      intent.wantsNearby && hasCoordinates
        ? results.filter(
            (item) =>
              item.distanceKm !== null &&
              item.distanceKm <= radiusKm,
          )
        : results;

    nearbyResults.sort((a, b) => {
      if (
        a.distanceKm !== null &&
        b.distanceKm !== null
      ) {
        return a.distanceKm - b.distanceKm;
      }

      if (a.isVerified !== b.isVerified) {
        return Number(b.isVerified) - Number(a.isVerified);
      }

      return 0;
    });

    return NextResponse.json({
      success: true,
      query,
      interpretation: {
        categoryKeywords: intent.categoryKeywords,
        location: intent.location,
        wantsNearby: intent.wantsNearby,
        searchTerms: intent.searchTerms,
        hasCoordinates,
        radiusKm,
      },
      total: nearbyResults.length,
      businesses: nearbyResults,
    });
  } catch (error) {
    console.error("Smart search error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء البحث. حاول مرة أخرى.",
      },
      { status: 500 },
    );
  }
}