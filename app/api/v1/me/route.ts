import { NextResponse } from "next/server";
import { getFirebaseApiUser } from "@/lib/auth/firebase-api-user";
import { firebaseApiErrorResponse } from "@/lib/api/firebase-response";

export async function GET(request: Request) {
  try {
    const user = await getFirebaseApiUser(request);
    return NextResponse.json({ data: { id: user.id, name: user.name, email: user.email, phone: user.phone, image: user.image, role: user.role } });
  } catch (error) {
    return firebaseApiErrorResponse(error);
  }
}
