import { NextRequest, NextResponse } from "next/server";

import { hasApiAccess } from "@/lib/auth";
import { getChannelConfigs, saveChannelConfig } from "@/lib/database";
import { formatReleaseAnnouncement, sampleReleasePayload } from "@/lib/formatters";
import { sendSlackAnnouncement } from "@/lib/integrations";
import { slackConfigSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!hasApiAccess(request)) {
    return NextResponse.json({ ok: false, message: "Paid access required." }, { status: 401 });
  }

  const configs = await getChannelConfigs();
  return NextResponse.json({ ok: true, config: configs.slack });
}

export async function POST(request: NextRequest) {
  if (!hasApiAccess(request)) {
    return NextResponse.json({ ok: false, message: "Paid access required." }, { status: 401 });
  }

  try {
    const parsed = slackConfigSchema.parse(await request.json());

    const config = await saveChannelConfig("slack", {
      enabled: parsed.enabled,
      template: parsed.template,
      botToken: parsed.botToken,
      channelId: parsed.channelId
    });

    if (parsed.sendTest && config.enabled) {
      const message = formatReleaseAnnouncement(sampleReleasePayload, config.template);
      await sendSlackAnnouncement(config, message);
    }

    return NextResponse.json({
      ok: true,
      message: parsed.sendTest ? "Slack test announcement sent." : "Slack configuration saved.",
      config
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Slack configuration failed."
      },
      { status: 400 }
    );
  }
}
