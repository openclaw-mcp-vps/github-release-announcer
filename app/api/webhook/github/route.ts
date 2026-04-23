import { NextRequest, NextResponse } from "next/server";
import { Webhooks } from "@octokit/webhooks";

import { getChannelConfigs, recordDeliveryLog } from "@/lib/database";
import { formatReleaseAnnouncement } from "@/lib/formatters";
import {
  sendDiscordAnnouncement,
  sendEmailAnnouncement,
  sendSlackAnnouncement,
  sendTwitterAnnouncement
} from "@/lib/integrations";
import { githubReleasePayloadSchema } from "@/lib/schemas";
import type { ChannelName } from "@/lib/types";

export const runtime = "nodejs";

const releaseActions = new Set(["published", "released", "prereleased"]);

async function logResult(
  repository: string,
  releaseTag: string,
  channel: ChannelName,
  ok: boolean,
  details: string
) {
  await recordDeliveryLog({
    repository,
    releaseTag,
    channel,
    ok,
    details
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, message: "Missing GITHUB_WEBHOOK_SECRET" }, { status: 500 });
  }

  const eventName = request.headers.get("x-github-event");
  const signature = request.headers.get("x-hub-signature-256") || "";
  const rawBody = await request.text();

  const webhooks = new Webhooks({ secret });
  const verified = await webhooks.verify(rawBody, signature);

  if (!verified) {
    return NextResponse.json({ ok: false, message: "Invalid GitHub webhook signature" }, { status: 401 });
  }

  if (eventName !== "release") {
    return NextResponse.json({ ok: true, ignored: true, reason: "Not a release event" });
  }

  try {
    const payload = githubReleasePayloadSchema.parse(JSON.parse(rawBody));

    if (!releaseActions.has(payload.action) || payload.release.draft) {
      return NextResponse.json({ ok: true, ignored: true, reason: `Release action ${payload.action} ignored` });
    }

    const configs = await getChannelConfigs();
    const repository = payload.repository.full_name;
    const releaseTag = payload.release.tag_name;

    const jobs: Array<Promise<{ channel: ChannelName; ok: boolean; message: string }>> = [];

    if (configs.slack.enabled) {
      jobs.push(
        (async () => {
          try {
            const announcement = formatReleaseAnnouncement(payload, configs.slack.template);
            await sendSlackAnnouncement(configs.slack, announcement);
            await logResult(repository, releaseTag, "slack", true, "Message sent");
            return { channel: "slack", ok: true, message: "sent" };
          } catch (error) {
            const message = error instanceof Error ? error.message : "Slack delivery failed";
            await logResult(repository, releaseTag, "slack", false, message);
            return { channel: "slack", ok: false, message };
          }
        })()
      );
    }

    if (configs.discord.enabled) {
      jobs.push(
        (async () => {
          try {
            const announcement = formatReleaseAnnouncement(payload, configs.discord.template);
            await sendDiscordAnnouncement(configs.discord, announcement);
            await logResult(repository, releaseTag, "discord", true, "Message sent");
            return { channel: "discord", ok: true, message: "sent" };
          } catch (error) {
            const message = error instanceof Error ? error.message : "Discord delivery failed";
            await logResult(repository, releaseTag, "discord", false, message);
            return { channel: "discord", ok: false, message };
          }
        })()
      );
    }

    if (configs.twitter.enabled) {
      jobs.push(
        (async () => {
          try {
            const announcement = formatReleaseAnnouncement(payload, configs.twitter.template);
            await sendTwitterAnnouncement(configs.twitter, announcement);
            await logResult(repository, releaseTag, "twitter", true, "Tweet published");
            return { channel: "twitter", ok: true, message: "sent" };
          } catch (error) {
            const message = error instanceof Error ? error.message : "Twitter delivery failed";
            await logResult(repository, releaseTag, "twitter", false, message);
            return { channel: "twitter", ok: false, message };
          }
        })()
      );
    }

    if (configs.email.enabled) {
      jobs.push(
        (async () => {
          try {
            const announcement = formatReleaseAnnouncement(payload, configs.email.template);
            await sendEmailAnnouncement(configs.email, announcement);
            await logResult(repository, releaseTag, "email", true, "Email sent");
            return { channel: "email", ok: true, message: "sent" };
          } catch (error) {
            const message = error instanceof Error ? error.message : "Email delivery failed";
            await logResult(repository, releaseTag, "email", false, message);
            return { channel: "email", ok: false, message };
          }
        })()
      );
    }

    if (jobs.length === 0) {
      return NextResponse.json({ ok: true, delivered: 0, failed: 0, reason: "No channels enabled" });
    }

    const results = await Promise.all(jobs);
    const delivered = results.filter((entry) => entry.ok).length;
    const failed = results.length - delivered;

    return NextResponse.json({
      ok: true,
      delivered,
      failed,
      results
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Invalid GitHub release payload"
      },
      { status: 400 }
    );
  }
}
