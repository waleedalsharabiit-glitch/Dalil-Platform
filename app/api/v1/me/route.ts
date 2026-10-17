import { NextResponse } from "next/server";
import { getMobileApiUser } from "@/lib/auth/mobile-api-user";
import { mobileApiErrorResponse } from "@/lib/api/mobile-response";

export async function GET(request: Request) {
  try {
    const user = await getMobileApiUser(request);
    return NextResponse.json({ data: { id: user.id, name: user.name, email: user.email, phone: user.phone, image: user.image, role: user.role } });
  } catch (error) {
    return mobileApiErrorResponse(error);
  }
}
