import { NextResponse } from "next/server";
import { getFirebaseApiUser } from "@/lib/auth/firebase-api-user";
import { firebaseApiErrorResponse } from "@/lib/api/firebase-response";
import { prisma } from "@/lib/db/prisma";

export async function DELETE(request: Request, { params }: { params: Promise<{ businessId: string }> }) {
  try {
    const user = await getFirebaseApiUser(request);
    const { businessId } = await params;
    await prisma.favorite.deleteMany({ where: { userId: user.id, businessId } });
    return NextResponse.json({ data: { businessId, isFavorite: false } });
  } catch (error) {
    return firebaseApiErrorResponse(error);
  }
}
