import { NextRequest, NextResponse } from "next/server";

import { hasApiAccess } from "@/lib/auth";
import { getChannelConfigs, saveChannelConfig } from "@/lib/database";
import { formatReleaseAnnouncement, sampleReleasePayload } from "@/lib/formatters";
import { sendEmailAnnouncement } from "@/lib/integrations";
import { emailConfigSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!hasApiAccess(request)) {
    return NextResponse.json({ ok: false, message: "Paid access required." }, { status: 401 });
  }

  const configs = await getChannelConfigs();
  return NextResponse.json({ ok: true, config: configs.email });
}

export async function POST(request: NextRequest) {
  if (!hasApiAccess(request)) {
    return NextResponse.json({ ok: false, message: "Paid access required." }, { status: 401 });
  }

  try {
    const parsed = emailConfigSchema.parse(await request.json());

    const config = await saveChannelConfig("email", {
      enabled: parsed.enabled,
      template: parsed.template,
      smtpHost: parsed.smtpHost,
      smtpPort: parsed.smtpPort,
      smtpSecure: parsed.smtpSecure,
      smtpUser: parsed.smtpUser,
      smtpPass: parsed.smtpPass,
      fromEmail: parsed.fromEmail,
      recipients: parsed.recipients
    });

    if (parsed.sendTest && config.enabled) {
      const message = formatReleaseAnnouncement(sampleReleasePayload, config.template);
      await sendEmailAnnouncement(config, message);
    }

    return NextResponse.json({
      ok: true,
      message: parsed.sendTest ? "Email test announcement sent." : "Email configuration saved.",
      config
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Email configuration failed."
      },
      { status: 400 }
    );
  }
}
