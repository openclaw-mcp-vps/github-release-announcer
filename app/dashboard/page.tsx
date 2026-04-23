import Link from "next/link";

import { ChannelConfig } from "@/components/ChannelConfig";
import { MessagePreview } from "@/components/MessagePreview";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageAccess } from "@/lib/auth";
import { getChannelConfigs, getDashboardSnapshot, getRecentDeliveryLogs } from "@/lib/database";
import { formatReleaseAnnouncement, sampleReleasePayload } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requirePageAccess();

  const [configs, snapshot, logs] = await Promise.all([
    getChannelConfigs(),
    getDashboardSnapshot(),
    getRecentDeliveryLogs(12)
  ]);

  const preview = formatReleaseAnnouncement(sampleReleasePayload).plainText;

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-6">
        <div>
          <h1 className="font-[var(--font-heading)] text-3xl font-bold text-white">Release Automation Dashboard</h1>
          <p className="mt-1 text-slate-400">Control credentials, templates, and delivery behavior for every announcement channel.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Active channels: {snapshot.activeChannels}</Badge>
          <Link href="/setup" className="text-sm text-sky-300 hover:text-sky-200">
            Setup Guide
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Deliveries Logged</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-3xl font-semibold text-white">{snapshot.totalDeliveries}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Last Delivery</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-300">
            {snapshot.lastDeliveryAt ? new Date(snapshot.lastDeliveryAt).toLocaleString() : "No deliveries yet"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Webhook Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-slate-300">
            <code className="rounded bg-slate-950 px-2 py-1">/api/webhook/github</code>
            <br />
            <code className="rounded bg-slate-950 px-2 py-1">/api/webhook/stripe</code>
          </CardContent>
        </Card>
      </section>

      <MessagePreview message={preview} />

      <ChannelConfig initialConfigs={configs} />

      <section className="space-y-4">
        <h2 className="font-[var(--font-heading)] text-xl font-semibold text-white">Recent Delivery Activity</h2>
        <Card>
          <CardContent className="pt-6">
            {logs.length === 0 ? (
              <p className="text-sm text-slate-400">No release deliveries recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="pb-2">Time</th>
                      <th className="pb-2">Repository</th>
                      <th className="pb-2">Tag</th>
                      <th className="pb-2">Channel</th>
                      <th className="pb-2">Result</th>
                      <th className="pb-2">Details</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="border-t border-slate-800">
                        <td className="py-2 pr-3 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="py-2 pr-3">{log.repository}</td>
                        <td className="py-2 pr-3">{log.releaseTag}</td>
                        <td className="py-2 pr-3 capitalize">{log.channel}</td>
                        <td className={`py-2 pr-3 ${log.ok ? "text-emerald-400" : "text-rose-400"}`}>
                          {log.ok ? "Sent" : "Failed"}
                        </td>
                        <td className="py-2 pr-3 text-slate-300">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
