import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "سجّل الدخول أولًا" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
  const businesses = await prisma.business.findMany({
    include: { owner: { select: { id: true, name: true, email: true } }, _count: { select: { reviews: true, requests: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 500,
  });
  return NextResponse.json({ businesses });
}
