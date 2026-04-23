import { createHmac, timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { registerStripeCheckoutSession } from "@/lib/database";
import { stripeEventSchema } from "@/lib/schemas";

export const runtime = "nodejs";

function verifyStripeSignature(payload: string, signatureHeader: string, secret: string): boolean {
  const elements = signatureHeader.split(",").map((part) => part.trim());

  const timestamp = elements.find((entry) => entry.startsWith("t="))?.slice(2);
  const signatures = elements.filter((entry) => entry.startsWith("v1=")).map((entry) => entry.slice(3));

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const toleranceSeconds = 300;
  const timestampNumber = Number(timestamp);

  if (!Number.isFinite(timestampNumber)) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestampNumber) > toleranceSeconds) {
    return false;
  }

  const payloadToSign = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(payloadToSign).digest("hex");

  return signatures.some((signature) => {
    const provided = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");

    if (provided.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(provided, expectedBuffer);
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, message: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, message: "Missing Stripe signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  if (!verifyStripeSignature(rawBody, signature, secret)) {
    return NextResponse.json({ ok: false, message: "Invalid Stripe signature" }, { status: 401 });
  }

  try {
    const event = stripeEventSchema.parse(JSON.parse(rawBody));

    if (event.type === "checkout.session.completed") {
      const sessionObject = event.data.object;
      const sessionId = typeof sessionObject.id === "string" ? sessionObject.id : "";
      const customerDetails =
        typeof sessionObject.customer_details === "object" && sessionObject.customer_details !== null
          ? (sessionObject.customer_details as Record<string, unknown>)
          : null;
      const email = customerDetails && typeof customerDetails.email === "string" ? customerDetails.email : null;

      if (sessionId) {
        await registerStripeCheckoutSession(sessionId, email);
      }
    }

    return NextResponse.json({ ok: true, received: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Invalid Stripe payload"
      },
      { status: 400 }
    );
  }
}
