import Link from "next/link";
import { headers } from "next/headers";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePageAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  await requirePageAccess();

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host") || "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;

  const githubWebhookUrl = `${baseUrl}/api/webhook/github`;
  const stripeWebhookUrl = `${baseUrl}/api/webhook/stripe`;
  const successUrl = `${baseUrl}/purchase/success?session_id={CHECKOUT_SESSION_ID}`;

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="font-[var(--font-heading)] text-3xl font-bold text-white">Setup Guide</h1>
          <p className="mt-1 text-slate-400">Configure GitHub and Stripe webhooks so release announcements and paywall access work end-to-end.</p>
        </div>
        <Link href="/dashboard" className="text-sm text-sky-300 hover:text-sky-200">
          Back to Dashboard
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>1. GitHub Webhook</CardTitle>
          <CardDescription>Repository Settings → Webhooks → Add webhook</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          <p>
            Payload URL: <code className="rounded bg-slate-950 px-2 py-1">{githubWebhookUrl}</code>
          </p>
          <p>Content type: <code className="rounded bg-slate-950 px-2 py-1">application/json</code></p>
          <p>Secret: set <code className="rounded bg-slate-950 px-2 py-1">GITHUB_WEBHOOK_SECRET</code> in your environment.</p>
          <p>Events: choose <code className="rounded bg-slate-950 px-2 py-1">Releases</code> only.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Stripe Webhook + Payment Link Success URL</CardTitle>
          <CardDescription>Stripe Dashboard → Developers → Webhooks and Payment Links</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          <p>
            Webhook endpoint: <code className="rounded bg-slate-950 px-2 py-1">{stripeWebhookUrl}</code>
          </p>
          <p>
            Listen for event: <code className="rounded bg-slate-950 px-2 py-1">checkout.session.completed</code>
          </p>
          <p>
            Set <code className="rounded bg-slate-950 px-2 py-1">STRIPE_WEBHOOK_SECRET</code> from Stripe in environment variables.
          </p>
          <p>
            Payment Link success redirect URL should be: <code className="rounded bg-slate-950 px-2 py-1">{successUrl}</code>
          </p>
          <p>
            This lets buyers arrive with a <code className="rounded bg-slate-950 px-2 py-1">session_id</code> that can be redeemed into a signed access cookie.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Channel Credentials</CardTitle>
          <CardDescription>Enter credentials once in Dashboard and send test announcements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          <p>Slack: bot token + destination channel ID.</p>
          <p>Discord: incoming webhook URL.</p>
          <p>Twitter/X: app key/secret + access token/secret.</p>
          <p>Email: SMTP host, auth credentials, sender, and recipient list.</p>
        </CardContent>
      </Card>
    </main>
  );
}
