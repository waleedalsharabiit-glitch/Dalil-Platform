import { NextResponse } from "next/server";
import { FirebaseApiError } from "@/lib/auth/firebase-api-user";

export function firebaseApiErrorResponse(error: unknown) {
  if (error instanceof FirebaseApiError) {
    return NextResponse.json({ error: { message: error.message } }, { status: error.status });
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: { message: "صيغة JSON غير صالحة" } }, { status: 400 });
  }
  console.error("Firebase API error:", error);
  return NextResponse.json({ error: { message: "حدث خطأ غير متوقع" } }, { status: 500 });
}

export function validationErrorResponse(message = "البيانات المدخلة غير صالحة") {
  return NextResponse.json({ error: { message } }, { status: 400 });
}
