import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";

import { prisma } from "@/lib/db/prisma";
import {
  issueMobileAccessToken,
  MobileApiError,
  MOBILE_TOKEN_TTL_SECONDS,
} from "@/lib/auth/mobile-api-user";
import { mobileApiErrorResponse } from "@/lib/api/mobile-response";

const googleClient = new OAuth2Client();

export async function POST(request: Request) {
  try {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      throw new MobileApiError(503, "Google authentication is not configured.");
    }

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
      !("idToken" in body) ||
      typeof body.idToken !== "string" ||
      body.idToken.length < 20 ||
      body.idToken.length > 10000
    ) {
      return NextResponse.json(
        { success: false, message: "A valid Google ID token is required." },
        { status: 400 },
      );
    }

    let payload;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: body.idToken,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    } catch {
      return NextResponse.json(
        { success: false, message: "Google ID token verification failed." },
        { status: 401 },
      );
    }

    if (
      !payload?.sub ||
      !payload.email ||
      payload.email_verified !== true
    ) {
      return NextResponse.json(
        { success: false, message: "Google must provide a verified email address." },
        { status: 401 },
      );
    }

    const email = payload.email.trim().toLowerCase();

    const linkedAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: payload.sub,
        },
      },
      include: { user: true },
    });

    let user =
      linkedAccount?.user ??
      await prisma.user.findUnique({ where: { email } });

    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            email,
            name: payload.name ?? null,
            image: payload.picture ?? null,
            emailVerified: new Date(),
            role: "USER",
            isActive: true,
          },
        });
      } catch (error) {
        const code =
          typeof error === "object" && error !== null && "code" in error
            ? (error as { code?: string }).code
            : undefined;

        if (code !== "P2002") throw error;
        user = await prisma.user.findUnique({ where: { email } });
      }
    }

    if (!user) {
      throw new MobileApiError(409, "Unable to resolve the Google account.");
    }

    if (!user.isActive) {
      throw new MobileApiError(403, "This account is disabled.");
    }

    if (!linkedAccount) {
      const accountData = {
        userId: user.id,
        type: "oidc",
        provider: "google",
        providerAccountId: payload.sub,
      };

      try {
        await prisma.account.create({ data: accountData });
      } catch (error) {
        const code =
          typeof error === "object" && error !== null && "code" in error
            ? (error as { code?: string }).code
            : undefined;

        const existing = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "google",
              providerAccountId: payload.sub,
            },
          },
        });

        if (code !== "P2002" || !existing || existing.userId !== user.id) {
          throw new MobileApiError(409, "This Google identity is already linked to another account.");
        }
      }
    }

    if (!user.emailVerified || (!user.name && payload.name) || (!user.image && payload.picture)) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: user.emailVerified ?? new Date(),
          ...(!user.name && payload.name ? { name: payload.name } : {}),
          ...(!user.image && payload.picture ? { image: payload.picture } : {}),
        },
      });
    }

    const accessToken = await issueMobileAccessToken(user.id);

    return NextResponse.json({
      success: true,
      message: "Signed in with Google.",
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