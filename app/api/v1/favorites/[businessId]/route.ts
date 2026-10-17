import { NextResponse } from "next/server";
import { getMobileApiUser } from "@/lib/auth/mobile-api-user";
import { mobileApiErrorResponse } from "@/lib/api/mobile-response";
import { prisma } from "@/lib/db/prisma";

export async function DELETE(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  try {
    const user = await getMobileApiUser(request);
    const { businessId } = await params;
    await prisma.favorite.deleteMany({ where: { userId: user.id, businessId } });
    return NextResponse.json({ data: { businessId, isFavorite: false } });
  } catch (error) {
    return mobileApiErrorResponse(error);
  }
}
