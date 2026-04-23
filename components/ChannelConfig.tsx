"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ChannelConfigMap, ChannelName } from "@/lib/types";

interface ChannelConfigProps {
  initialConfigs: ChannelConfigMap;
}

const channelDescriptions: Record<ChannelName, string> = {
  slack:
    "Post release announcements into a Slack channel using a bot token and destination channel ID.",
  discord: "Send release announcements via a Discord Incoming Webhook URL.",
  twitter: "Publish concise release tweets via X API v2 user context credentials.",
  email: "Send release digests through SMTP to a comma-separated recipient list."
};

const channelOrder: ChannelName[] = ["slack", "discord", "twitter", "email"];

export function ChannelConfig({ initialConfigs }: ChannelConfigProps) {
  const [configs, setConfigs] = useState<ChannelConfigMap>(initialConfigs);
  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "error"; text: string }>({
    kind: "idle",
    text: ""
  });
  const [busyChannel, setBusyChannel] = useState<ChannelName | null>(null);

  const activeCount = useMemo(
    () => Object.values(configs).filter((channel) => channel.enabled).length,
    [configs]
  );

  function updateField(channel: ChannelName, field: string, value: string | boolean) {
    setConfigs((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [field]: value
      }
    }));
  }

  async function saveChannel(channel: ChannelName, sendTest: boolean) {
    setBusyChannel(channel);
    setStatus({ kind: "idle", text: "" });

    try {
      const response = await fetch(`/api/integrations/${channel}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...configs[channel],
          sendTest
        })
      });

      const payload = (await response.json()) as {
        ok: boolean;
        message: string;
        config?: ChannelConfigMap[ChannelName];
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Failed to save channel settings.");
      }

      setConfigs((prev) => ({
        ...prev,
        [channel]: (payload.config ?? prev[channel]) as ChannelConfigMap[ChannelName]
      }));

      setStatus({
        kind: "ok",
        text: sendTest
          ? `${channel.toUpperCase()} configuration saved and test message sent.`
          : `${channel.toUpperCase()} configuration saved.`
      });
    } catch (error) {
      setStatus({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not save configuration."
      });
    } finally {
      setBusyChannel(null);
    }
  }

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Announcement Channels</CardTitle>
          <CardDescription>
            Configure credentials once. Every new GitHub release event will fan out automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-300">{activeCount} channels currently enabled.</p>
          {status.text ? (
            <p
              className={`mt-3 text-sm ${
                status.kind === "ok" ? "text-emerald-400" : status.kind === "error" ? "text-rose-400" : "text-slate-300"
              }`}
            >
              {status.text}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {channelOrder.map((channel) => {
          const config: any = configs[channel];
          const isBusy = busyChannel === channel;

          return (
            <Card key={channel} className="h-full">
              <CardHeader>
                <CardTitle className="capitalize">{channel}</CardTitle>
                <CardDescription>{channelDescriptions[channel]}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-3 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(event) => updateField(channel, "enabled", event.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-500"
                  />
                  Enable {channel} delivery
                </label>

                {channel === "slack" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="slack-token">Bot Token</Label>
                      <Input
                        id="slack-token"
                        type="password"
                        value={config.botToken}
                        onChange={(event) => updateField(channel, "botToken", event.target.value)}
                        placeholder="xoxb-..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slack-channel">Channel ID</Label>
                      <Input
                        id="slack-channel"
                        value={config.channelId}
                        onChange={(event) => updateField(channel, "channelId", event.target.value)}
                        placeholder="C0123456789"
                      />
                    </div>
                  </>
                ) : null}

                {channel === "discord" ? (
                  <div className="space-y-2">
                    <Label htmlFor="discord-webhook">Webhook URL</Label>
                    <Input
                      id="discord-webhook"
                      value={config.webhookUrl}
                      onChange={(event) => updateField(channel, "webhookUrl", event.target.value)}
                      placeholder="https://discord.com/api/webhooks/..."
                    />
                  </div>
                ) : null}

                {channel === "twitter" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="twitter-app-key">App Key</Label>
                      <Input
                        id="twitter-app-key"
                        value={config.appKey}
                        onChange={(event) => updateField(channel, "appKey", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitter-app-secret">App Secret</Label>
                      <Input
                        id="twitter-app-secret"
                        type="password"
                        value={config.appSecret}
                        onChange={(event) => updateField(channel, "appSecret", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitter-access-token">Access Token</Label>
                      <Input
                        id="twitter-access-token"
                        value={config.accessToken}
                        onChange={(event) => updateField(channel, "accessToken", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twitter-access-secret">Access Secret</Label>
                      <Input
                        id="twitter-access-secret"
                        type="password"
                        value={config.accessSecret}
                        onChange={(event) => updateField(channel, "accessSecret", event.target.value)}
                      />
                    </div>
                  </>
                ) : null}

                {channel === "email" ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email-smtp-host">SMTP Host</Label>
                        <Input
                          id="email-smtp-host"
                          value={config.smtpHost}
                          onChange={(event) => updateField(channel, "smtpHost", event.target.value)}
                          placeholder="smtp.mailgun.org"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email-smtp-port">SMTP Port</Label>
                        <Input
                          id="email-smtp-port"
                          value={config.smtpPort}
                          onChange={(event) => updateField(channel, "smtpPort", event.target.value)}
                          placeholder="587"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-3 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={config.smtpSecure}
                        onChange={(event) => updateField(channel, "smtpSecure", event.target.checked)}
                        className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-500"
                      />
                      Use TLS/SSL
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email-smtp-user">SMTP Username</Label>
                        <Input
                          id="email-smtp-user"
                          value={config.smtpUser}
                          onChange={(event) => updateField(channel, "smtpUser", event.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email-smtp-pass">SMTP Password</Label>
                        <Input
                          id="email-smtp-pass"
                          type="password"
                          value={config.smtpPass}
                          onChange={(event) => updateField(channel, "smtpPass", event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-from">From Address</Label>
                      <Input
                        id="email-from"
                        value={config.fromEmail}
                        onChange={(event) => updateField(channel, "fromEmail", event.target.value)}
                        placeholder="releases@yourteam.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-recipients">Recipients</Label>
                      <Input
                        id="email-recipients"
                        value={config.recipients}
                        onChange={(event) => updateField(channel, "recipients", event.target.value)}
                        placeholder="team@example.com, users@example.com"
                      />
                    </div>
                  </>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor={`${channel}-template`}>Template</Label>
                  <Textarea
                    id={`${channel}-template`}
                    value={config.template}
                    onChange={(event) => updateField(channel, "template", event.target.value)}
                    rows={6}
                  />
                  <p className="text-xs text-slate-500">
                    Available variables: {'{repo}'}, {'{tag}'}, {'{name}'}, {'{notes}'}, {'{url}'}, {'{author}'}, {'{publishedAt}'}.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => saveChannel(channel, false)} disabled={isBusy}>
                    {isBusy ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => saveChannel(channel, true)}
                    disabled={isBusy}
                  >
                    {isBusy ? "Sending..." : "Save + Send Test"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
