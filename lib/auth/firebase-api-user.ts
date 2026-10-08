import type { DecodedIdToken } from "firebase-admin/auth";
import { prisma } from "@/lib/db/prisma";
import { getFirebaseAdminAuth } from "@/lib/auth/firebase-admin";

export class FirebaseApiError extends Error {
  constructor(public readonly status: 401 | 403 | 503, message: string) {
    super(message);
    this.name = "FirebaseApiError";
  }
}

async function verifyRequestToken(request: Request): Promise<DecodedIdToken> {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) throw new FirebaseApiError(401, "Bearer token مطلوب");

  try {
    return await getFirebaseAdminAuth().verifyIdToken(match[1], true);
  } catch (error) {
    if (error instanceof Error && error.message === "FIREBASE_ADMIN_NOT_CONFIGURED") {
      throw new FirebaseApiError(503, "مصادقة Firebase غير مهيأة على الخادم");
    }
    throw new FirebaseApiError(401, "رمز Firebase غير صالح أو منتهي الصلاحية");
  }
}

export async function getFirebaseApiUser(request: Request) {
  const decoded = await verifyRequestToken(request);
  const email = decoded.email?.trim().toLowerCase() || `${decoded.uid}@firebase.local`;
  let user = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid } });

  if (!user && decoded.email && decoded.email_verified) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: { firebaseUid: decoded.uid, emailVerified: existing.emailVerified ?? new Date() },
      });
    }
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        firebaseUid: decoded.uid,
        email,
        name: typeof decoded.name === "string" ? decoded.name : null,
        image: typeof decoded.picture === "string" ? decoded.picture : null,
        emailVerified: decoded.email_verified ? new Date() : null,
      },
    });
  } else if (user.isActive && (user.name !== decoded.name || user.image !== decoded.picture)) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(typeof decoded.name === "string" ? { name: decoded.name } : {}),
        ...(typeof decoded.picture === "string" ? { image: decoded.picture } : {}),
      },
    });
  }

  if (!user.isActive) throw new FirebaseApiError(403, "الحساب موقوف");
  return user;
}
