import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const schema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "REJECTED"]).optional(),
  isVerified: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, { message: "حدد إجراءً واحدًا على الأقل" });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "سجّل الدخول أولًا" }, { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "البيانات غير صحيحة", errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  const business = await prisma.business.update({ where: { id }, data: parsed.data, select: { id: true, status: true, isVerified: true } }).catch(() => null);
  if (!business) return NextResponse.json({ message: "النشاط غير موجود" }, { status: 404 });
  return NextResponse.json({ business, message: "تم تحديث حالة النشاط" });
}
