import { NextRequest, NextResponse } from "next/server";

import { hasApiAccess } from "@/lib/auth";
import { getChannelConfigs, saveChannelConfig } from "@/lib/database";
import { formatReleaseAnnouncement, sampleReleasePayload } from "@/lib/formatters";
import { sendDiscordAnnouncement } from "@/lib/integrations";
import { discordConfigSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!hasApiAccess(request)) {
    return NextResponse.json({ ok: false, message: "Paid access required." }, { status: 401 });
  }

  const configs = await getChannelConfigs();
  return NextResponse.json({ ok: true, config: configs.discord });
}

export async function POST(request: NextRequest) {
  if (!hasApiAccess(request)) {
    return NextResponse.json({ ok: false, message: "Paid access required." }, { status: 401 });
  }

  try {
    const parsed = discordConfigSchema.parse(await request.json());

    const config = await saveChannelConfig("discord", {
      enabled: parsed.enabled,
      template: parsed.template,
      webhookUrl: parsed.webhookUrl
    });

    if (parsed.sendTest && config.enabled) {
      const message = formatReleaseAnnouncement(sampleReleasePayload, config.template);
      await sendDiscordAnnouncement(config, message);
    }

    return NextResponse.json({
      ok: true,
      message: parsed.sendTest ? "Discord test announcement sent." : "Discord configuration saved.",
      config
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Discord configuration failed."
      },
      { status: 400 }
    );
  }
}
