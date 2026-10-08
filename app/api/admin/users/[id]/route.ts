import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

const updateSchema = z.object({
  role: z.enum(["USER", "BUSINESS_OWNER", "ADMIN", "SUPER_ADMIN"]).optional(),
  isActive: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, { message: "حدد تغييرًا واحدًا على الأقل" });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ message: "سجّل الدخول أولًا" }, { status: 401 });
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  if (!isSuperAdmin && session.user.role !== "ADMIN") return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
  const { id } = await params;
  const body: unknown = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "البيانات غير صحيحة", errors: parsed.error.flatten().fieldErrors }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!target) return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });
  if (target.role === "SUPER_ADMIN" && !isSuperAdmin) return NextResponse.json({ message: "لا يمكنك تعديل حساب مدير أعلى" }, { status: 403 });
  if (target.role === "ADMIN" && !isSuperAdmin) return NextResponse.json({ message: "إدارة حسابات المدراء متاحة للمدير الأعلى فقط" }, { status: 403 });
  if ((parsed.data.role === "ADMIN" || parsed.data.role === "SUPER_ADMIN") && !isSuperAdmin) return NextResponse.json({ message: "تغيير صلاحية المدير متاح للمدير الأعلى فقط" }, { status: 403 });
  if (id === session.user.id && (parsed.data.isActive === false || (parsed.data.role && parsed.data.role !== session.user.role))) return NextResponse.json({ message: "لا يمكنك تعطيل حسابك أو تغيير صلاحيتك الحالية" }, { status: 400 });

  const user = await prisma.user.update({ where: { id }, data: parsed.data, select: { id: true, name: true, email: true, role: true, isActive: true } });
  return NextResponse.json({ user, message: "تم تحديث حساب المستخدم" });
}
