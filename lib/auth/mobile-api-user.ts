import { jwtVerify, SignJWT } from "jose";
import { prisma } from "@/lib/db/prisma";

const MOBILE_ISSUER = "dalil-platform";
const MOBILE_AUDIENCE = "dalil-mobile";
export const MOBILE_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export class MobileApiError extends Error {
  constructor(
    public readonly status: 400 | 401 | 403 | 409 | 503,
    message: string,
  ) {
    super(message);
    this.name = "MobileApiError";
  }
}

function mobileSecret(): Uint8Array {
  const value = process.env.MOBILE_AUTH_SECRET;

  if (!value || new TextEncoder().encode(value).length < 32) {
    throw new MobileApiError(503, "Mobile authentication is not configured.");
  }

  return new TextEncoder().encode(value);
}

export async function issueMobileAccessToken(userId: string): Promise<string> {
  return new SignJWT({ scope: "mobile" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(MOBILE_ISSUER)
    .setAudience(MOBILE_AUDIENCE)
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(mobileSecret());
}

export async function getMobileApiUser(request: Request) {
  const authorization = request.headers.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  if (!match?.[1]) {
    throw new MobileApiError(401, "A Bearer access token is required.");
  }

  const secret = mobileSecret();
  let userId: string | undefined;

  try {
    const result = await jwtVerify(match[1], secret, {
      algorithms: ["HS256"],
      issuer: MOBILE_ISSUER,
      audience: MOBILE_AUDIENCE,
    });

    userId = result.payload.sub;
  } catch {
    throw new MobileApiError(401, "The mobile access token is invalid or expired.");
  }

  if (!userId) {
    throw new MobileApiError(401, "The mobile access token has no subject.");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new MobileApiError(401, "The account associated with this token no longer exists.");
  }

  if (!user.isActive) {
    throw new MobileApiError(403, "This account is disabled.");
  }

  return user;
}