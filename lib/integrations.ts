import { WebClient } from "@slack/web-api";
import nodemailer from "nodemailer";
import { TwitterApi } from "twitter-api-v2";

import type {
  DiscordConfig,
  EmailConfig,
  FormattedAnnouncement,
  SlackConfig,
  TwitterConfig
} from "@/lib/types";

export async function sendSlackAnnouncement(
  config: SlackConfig,
  message: FormattedAnnouncement
): Promise<void> {
  if (!config.botToken || !config.channelId) {
    throw new Error("Slack bot token and channel ID are required.");
  }

  const client = new WebClient(config.botToken);
  await client.chat.postMessage({
    channel: config.channelId,
    text: message.slackText,
    mrkdwn: true
  });
}

export async function sendDiscordAnnouncement(
  config: DiscordConfig,
  message: FormattedAnnouncement
): Promise<void> {
  if (!config.webhookUrl) {
    throw new Error("Discord webhook URL is required.");
  }

  const response = await fetch(config.webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content: message.discordText.slice(0, 2000),
      allowed_mentions: { parse: [] }
    })
  });

  if (!response.ok) {
    const reason = await response.text();
    throw new Error(`Discord webhook failed: ${response.status} ${reason}`);
  }
}

export async function sendTwitterAnnouncement(
  config: TwitterConfig,
  message: FormattedAnnouncement
): Promise<void> {
  if (!config.appKey || !config.appSecret || !config.accessToken || !config.accessSecret) {
    throw new Error("Twitter API credentials are required.");
  }

  const client = new TwitterApi({
    appKey: config.appKey,
    appSecret: config.appSecret,
    accessToken: config.accessToken,
    accessSecret: config.accessSecret
  });

  await client.v2.tweet(message.tweetText);
}

export async function sendEmailAnnouncement(
  config: EmailConfig,
  message: FormattedAnnouncement
): Promise<void> {
  if (!config.smtpHost || !config.smtpPort || !config.fromEmail || !config.recipients) {
    throw new Error("SMTP settings, sender, and recipient list are required.");
  }

  const recipients = config.recipients
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    throw new Error("At least one recipient email address is required.");
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: Number(config.smtpPort),
    secure: config.smtpSecure,
    auth:
      config.smtpUser || config.smtpPass
        ? {
            user: config.smtpUser,
            pass: config.smtpPass
          }
        : undefined
  });

  await transporter.sendMail({
    from: config.fromEmail,
    to: recipients,
    subject: message.emailSubject,
    text: message.emailText,
    html: message.emailHtml
  });
}
