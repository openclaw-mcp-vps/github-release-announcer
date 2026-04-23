import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

export const ACCESS_COOKIE_NAME = "release_announcer_access";

interface AccessTokenPayload {
  sid: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSigningSecret(): string {
  return process.env.ACCESS_COOKIE_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "development-signing-secret";
}

function sign(value: string): string {
  return createHmac("sha256", getSigningSecret()).update(value).digest("base64url");
}

export function createAccessToken(sessionId: string, ttlSeconds = 60 * 60 * 24 * 30): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AccessTokenPayload = {
    sid: sessionId,
    iat: now,
    exp: now + ttlSeconds
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyAccessToken(token: string | undefined | null): AccessTokenPayload | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expected = sign(encodedPayload);
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AccessTokenPayload;
    const now = Math.floor(Date.now() / 1000);
    if (!payload.sid || payload.exp <= now) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function hasApiAccess(request: NextRequest): boolean {
  const cookieValue = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  return Boolean(verifyAccessToken(cookieValue));
}

export async function requirePageAccess(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  if (!verifyAccessToken(token)) {
    redirect("/access");
  }
}
