import { NextResponse } from "next/server";
import { z } from "zod";
import { getMobileApiUser } from "@/lib/auth/mobile-api-user";
import { mobileApiErrorResponse } from "@/lib/api/mobile-response";
import { prisma } from "@/lib/db/prisma";

const requestSchema = z.object({
  businessId: z.string().min(1).max(100),
  serviceId: z.string().min(1).max(100).optional().nullable(),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(2000).optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const user = await getMobileApiUser(request);
    const rows = await prisma.serviceRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100,
      select: { id: true, title: true, description: true, status: true, createdAt: true, updatedAt: true, service: { select: { id: true, name: true } }, business: { select: { id: true, name: true, slug: true } } } });
    return NextResponse.json({ data: rows });
  } catch (error) {
    return mobileApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getMobileApiUser(request);
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: { message: "تحقق من النشاط والخدمة والعنوان والوصف" }, issues: parsed.error.flatten() }, { status: 400 });
    const { businessId, serviceId, title, description } = parsed.data;
    const business = await prisma.business.findFirst({ where: { id: businessId, status: "ACTIVE", ...(serviceId ? { services: { some: { serviceId, service: { isActive: true } } } } : {}) }, select: { id: true } });
    if (!business) return NextResponse.json({ error: { message: "النشاط غير موجود أو الخدمة غير متاحة لديه" } }, { status: 404 });
    const created = await prisma.serviceRequest.create({ data: { userId: user.id, businessId, serviceId: serviceId || null, title, description: description || null }, select: { id: true, title: true, description: true, status: true, createdAt: true, business: { select: { id: true, name: true } }, service: { select: { id: true, name: true } } } });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return mobileApiErrorResponse(error);
  }
}
