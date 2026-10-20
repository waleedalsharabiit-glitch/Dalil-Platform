import { NextResponse } from "next/server";
import { getMobileApiUser } from "@/lib/auth/mobile-api-user";
import { mobileApiErrorResponse } from "@/lib/api/mobile-response";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  try {
    const user = await getMobileApiUser(request);
    if (user.role !== "BUSINESS_OWNER") {
      return NextResponse.json({ success: false, message: "هذه الخدمة متاحة لأصحاب الأنشطة فقط." }, { status: 403 });
    }

    const [categories, services] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ parentId: "asc" }, { name: "asc" }],
        select: { id: true, name: true, slug: true },
      }),
      prisma.service.findMany({
        where: { isActive: true, category: { isActive: true } },
        orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
        select: { id: true, name: true, slug: true, categoryId: true, category: { select: { name: true } } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      categories,
      services: services.map(({ category, ...service }) => ({ ...service, categoryName: category.name })),
    });
  } catch (error) {
    return mobileApiErrorResponse(error);
  }
}
