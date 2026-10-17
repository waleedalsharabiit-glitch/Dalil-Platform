import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "يجب تسجيل الدخول أولًا." }, { status: 401 });
    }
    const reviews = await prisma.review.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, rating: true, comment: true, isPublished: true, createdAt: true,
        business: { select: { id: true, name: true, slug: true } },
      },
    });
    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error("GET /api/reviews/mine error:", error);
    return NextResponse.json({ success: false, message: "تعذر تحميل مراجعاتك." }, { status: 500 });
  }
}
