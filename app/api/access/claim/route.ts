import { NextRequest, NextResponse } from "next/server";

import { ACCESS_COOKIE_NAME, createAccessToken } from "@/lib/auth";
import { claimStripeCheckoutSession } from "@/lib/database";
import { accessClaimSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const parsed = accessClaimSchema.parse(await request.json());
    const record = await claimStripeCheckoutSession(parsed.sessionId);

    if (!record) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Checkout session not found or already redeemed. Confirm Stripe webhook delivery and session ID."
        },
        { status: 403 }
      );
    }

    const token = createAccessToken(record.sessionId);
    const response = NextResponse.json({ ok: true, message: "Access granted." });
    response.cookies.set({
      name: ACCESS_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Could not redeem session"
      },
      { status: 400 }
    );
  }
}
