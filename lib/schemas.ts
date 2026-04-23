import { z } from "zod";

export const slackConfigSchema = z
  .object({
    enabled: z.boolean(),
    template: z.string().min(1),
    botToken: z.string().optional().default(""),
    channelId: z.string().optional().default(""),
    sendTest: z.boolean().optional().default(false)
  })
  .passthrough();

export const discordConfigSchema = z
  .object({
    enabled: z.boolean(),
    template: z.string().min(1),
    webhookUrl: z.string().optional().default(""),
    sendTest: z.boolean().optional().default(false)
  })
  .passthrough();

export const twitterConfigSchema = z
  .object({
    enabled: z.boolean(),
    template: z.string().min(1),
    appKey: z.string().optional().default(""),
    appSecret: z.string().optional().default(""),
    accessToken: z.string().optional().default(""),
    accessSecret: z.string().optional().default(""),
    sendTest: z.boolean().optional().default(false)
  })
  .passthrough();

export const emailConfigSchema = z
  .object({
    enabled: z.boolean(),
    template: z.string().min(1),
    smtpHost: z.string().optional().default(""),
    smtpPort: z.string().optional().default("587"),
    smtpSecure: z.boolean().optional().default(false),
    smtpUser: z.string().optional().default(""),
    smtpPass: z.string().optional().default(""),
    fromEmail: z.string().optional().default(""),
    recipients: z.string().optional().default(""),
    sendTest: z.boolean().optional().default(false)
  })
  .passthrough();

export const accessClaimSchema = z.object({
  sessionId: z.string().min(8).max(255)
});

export const githubReleasePayloadSchema = z.object({
  action: z.string(),
  repository: z.object({
    full_name: z.string(),
    html_url: z.string().url().or(z.string()),
    name: z.string(),
    owner: z.object({
      login: z.string()
    })
  }),
  release: z.object({
    id: z.number().int(),
    tag_name: z.string(),
    name: z.string().optional().default(""),
    body: z.string().optional().default(""),
    html_url: z.string().url().or(z.string()),
    prerelease: z.boolean(),
    draft: z.boolean(),
    target_commitish: z.string(),
    published_at: z.string().optional().default("")
  }),
  sender: z
    .object({
      login: z.string()
    })
    .optional()
});

export const stripeEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.record(z.string(), z.unknown())
  })
});
