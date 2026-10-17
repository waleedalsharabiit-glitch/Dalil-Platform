import { NextResponse } from "next/server";
import { MobileApiError } from "@/lib/auth/mobile-api-user";

export function mobileApiErrorResponse(error: unknown) {
  if (error instanceof MobileApiError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.status },
    );
  }

  console.error("Mobile API error:", error);

  return NextResponse.json(
    { success: false, message: "An internal server error occurred." },
    { status: 500 },
  );
}