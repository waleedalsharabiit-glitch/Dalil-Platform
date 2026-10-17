import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db/prisma";
import {
  issueMobileAccessToken,
  MobileApiError,
  MOBILE_TOKEN_TTL_SECONDS,
} from "@/lib/auth/mobile-api-user";
import { mobileApiErrorResponse } from "@/lib/api/mobile-response";

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("email" in body) ||
      typeof body.email !== "string" ||
      !("password" in body) ||
      typeof body.password !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 },
      );
    }

    const email = body.email.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.password || !user.isActive) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 },
      );
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 },
      );
    }

    const accessToken = await issueMobileAccessToken(user.id);

    return NextResponse.json({
      success: true,
      message: "Signed in successfully.",
      data: {
        accessToken,
        tokenType: "Bearer",
        expiresIn: MOBILE_TOKEN_TTL_SECONDS,
        user: {
          id: user.id,
          name: user.name ?? email.split("@")[0],
          email: user.email,
          phone: user.phone,
          image: user.image,
          role: user.role,
        },
      },
    });
  } catch (error) {
    return mobileApiErrorResponse(error);
  }
}