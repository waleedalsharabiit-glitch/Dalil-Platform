import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/db/prisma";
import { extractSearchIntent } from "@/lib/search/ai-search";
import { getImageUrlWithVariant } from "@/lib/storage/business-image-storage";

export async function searchBusinesses(query: string, categorySlug?: string) {
  const { intent, aiPowered } = await extractSearchIntent(query);
  const where: Prisma.BusinessWhereInput = { status: "ACTIVE" };

  if (categorySlug) {
    where.categories = {
      some: {
        category: {
          OR: [
            { slug: categorySlug },
            { slug: { equals: categorySlug, mode: "insensitive" } },
          ],
        },
      },
    };
  }

  if (intent.terms.length) {
    where.OR = intent.terms.flatMap((term) => [
      { name: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { services: { some: { service: { name: { contains: term, mode: "insensitive" } } } } },
      { categories: { some: { category: { name: { contains: term, mode: "insensitive" } } } } },
    ]);
  }

  if (intent.category) {
    where.categories = {
      some: {
        category: {
          OR: [
            { name: { contains: intent.category, mode: "insensitive" } },
            { slug: { contains: intent.category, mode: "insensitive" } },
          ],
        },
      },
    };
  }

  if (intent.service) {
    where.services = {
      some: {
        service: { name: { contains: intent.service, mode: "insensitive" } },
      },
    };
  }

  if (intent.city) {
    where.locations = {
      some: { city: { contains: intent.city, mode: "insensitive" } },
    };
  }

  const businesses = await prisma.business.findMany({
    where,
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      locations: { take: 1 },
    },
    orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
    take: 30,
  });

  const ratings = businesses.length
    ? await prisma.review.groupBy({
        by: ["businessId"],
        where: { businessId: { in: businesses.map((business) => business.id) }, isPublished: true },
        _avg: { rating: true },
        _count: { _all: true },
      })
    : [];
  const ratingsByBusiness = new Map(ratings.map((item) => [item.businessId, item]));

  return {
    intent,
    aiPowered,
    businesses: businesses.map((business) => {
      const location = business.locations[0];
      const rating = ratingsByBusiness.get(business.id);
      return {
        id: business.id,
        name: business.name,
        slug: business.slug,
        description: business.description,
        imageUrl: getImageUrlWithVariant(business.images[0]?.url ?? null, "card"),
        city: location?.city ?? null,
        district: location?.district ?? null,
        rating: rating?._avg.rating ?? 0,
        reviewsCount: rating?._count._all ?? 0,
        isVerified: business.isVerified,
      };
    }),
  };
}
