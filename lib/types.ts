export type ChannelName = "slack" | "discord" | "twitter" | "email";

interface ChannelConfigBase {
  enabled: boolean;
  template: string;
  updatedAt: string;
}

export interface SlackConfig extends ChannelConfigBase {
  botToken: string;
  channelId: string;
}

export interface DiscordConfig extends ChannelConfigBase {
  webhookUrl: string;
}

export interface TwitterConfig extends ChannelConfigBase {
  appKey: string;
  appSecret: string;
  accessToken: string;
  accessSecret: string;
}

export interface EmailConfig extends ChannelConfigBase {
  smtpHost: string;
  smtpPort: string;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  recipients: string;
}

export interface ChannelConfigMap {
  slack: SlackConfig;
  discord: DiscordConfig;
  twitter: TwitterConfig;
  email: EmailConfig;
}

export interface StripeCheckoutRecord {
  sessionId: string;
  email: string | null;
  createdAt: string;
  claimedAt: string | null;
}

export interface DeliveryLog {
  id: string;
  releaseTag: string;
  repository: string;
  channel: ChannelName;
  ok: boolean;
  details: string;
  createdAt: string;
}

export interface DataStore {
  channelConfigs: ChannelConfigMap;
  stripeCheckoutSessions: Record<string, StripeCheckoutRecord>;
  deliveryLogs: DeliveryLog[];
}

export interface GitHubReleaseEventPayload {
  action: string;
  repository: {
    full_name: string;
    html_url: string;
    name: string;
    owner: {
      login: string;
    };
  };
  release: {
    id: number;
    tag_name: string;
    name: string;
    body: string;
    html_url: string;
    prerelease: boolean;
    draft: boolean;
    target_commitish: string;
    published_at: string;
    author?: {
      login: string;
    };
  };
  sender?: {
    login: string;
  };
}

export interface FormattedAnnouncement {
  plainText: string;
  slackText: string;
  discordText: string;
  tweetText: string;
  emailSubject: string;
  emailText: string;
  emailHtml: string;
}

export interface ReleaseTemplateVariables {
  repo: string;
  repoUrl: string;
  tag: string;
  name: string;
  notes: string;
  url: string;
  author: string;
  publishedAt: string;
}
