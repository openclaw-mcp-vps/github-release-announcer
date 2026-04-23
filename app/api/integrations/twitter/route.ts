import { NextRequest, NextResponse } from "next/server";

import { hasApiAccess } from "@/lib/auth";
import { getChannelConfigs, saveChannelConfig } from "@/lib/database";
import { formatReleaseAnnouncement, sampleReleasePayload } from "@/lib/formatters";
import { sendTwitterAnnouncement } from "@/lib/integrations";
import { twitterConfigSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!hasApiAccess(request)) {
    return NextResponse.json({ ok: false, message: "Paid access required." }, { status: 401 });
  }

  const configs = await getChannelConfigs();
  return NextResponse.json({ ok: true, config: configs.twitter });
}

export async function POST(request: NextRequest) {
  if (!hasApiAccess(request)) {
    return NextResponse.json({ ok: false, message: "Paid access required." }, { status: 401 });
  }

  try {
    const parsed = twitterConfigSchema.parse(await request.json());

    const config = await saveChannelConfig("twitter", {
      enabled: parsed.enabled,
      template: parsed.template,
      appKey: parsed.appKey,
      appSecret: parsed.appSecret,
      accessToken: parsed.accessToken,
      accessSecret: parsed.accessSecret
    });

    if (parsed.sendTest && config.enabled) {
      const message = formatReleaseAnnouncement(sampleReleasePayload, config.template);
      await sendTwitterAnnouncement(config, message);
    }

    return NextResponse.json({
      ok: true,
      message: parsed.sendTest ? "Twitter test announcement sent." : "Twitter configuration saved.",
      config
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Twitter configuration failed."
      },
      { status: 400 }
    );
  }
}
