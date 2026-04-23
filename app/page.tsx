import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const faqs = [
  {
    question: "How does release detection work?",
    answer:
      "Connect the GitHub webhook endpoint once. Every release publish event is verified, formatted, and dispatched to enabled channels automatically."
  },
  {
    question: "Can we customize messaging per channel?",
    answer:
      "Yes. Slack, Discord, Twitter, and email each support independent templates and credentials. Variables like {tag}, {url}, and {notes} are available."
  },
  {
    question: "What happens if one channel fails?",
    answer:
      "Delivery is isolated by channel. A Twitter failure will not block Slack or email. The dashboard keeps delivery logs so you can diagnose quickly."
  },
  {
    question: "How is access controlled after payment?",
    answer:
      "Stripe checkout sessions are validated via webhook and exchanged for a signed access cookie. The dashboard and integration endpoints are paywalled."
  }
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-100">
          GitHub Release Announcer
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/setup" className="text-sm text-slate-300 transition hover:text-white">
            Setup
          </Link>
          <Link href="/dashboard" className="text-sm text-slate-300 transition hover:text-white">
            Dashboard
          </Link>
          <a
            href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}
            className="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-400"
          >
            Buy for $15/mo
          </a>
        </nav>
      </header>

      <section className="grid gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Badge className="bg-emerald-500 text-slate-950">Automation Tools</Badge>
          <h1 className="font-[var(--font-heading)] text-4xl font-bold leading-tight text-white sm:text-5xl">
            Auto-announce releases across all channels
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Stop shipping silently. GitHub Release Announcer listens for release events and instantly posts polished announcements to Slack,
            Discord, Twitter, and your email lists.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}>
              <Button size="lg">Start for $15/mo</Button>
            </a>
            <Link href="/access">
              <Button size="lg" variant="outline">
                Already purchased? Unlock dashboard
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 text-sm text-slate-400 sm:grid-cols-3">
            <p>GitHub release webhook verified with HMAC signatures</p>
            <p>Per-channel templates with live preview before going live</p>
            <p>Delivery logs for troubleshooting and auditability</p>
          </div>
        </div>

        <Card className="border-sky-900/70 bg-slate-900/70">
          <CardHeader>
            <CardTitle>What teams gain</CardTitle>
            <CardDescription>No more missed release announcements or inconsistent messaging.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <p>
              <span className="font-semibold text-slate-100">Before:</span> Engineers cut a release, then someone remembers to post in one
              or two channels hours later.
            </p>
            <p>
              <span className="font-semibold text-slate-100">After:</span> Publish on GitHub once. Every customer channel updates in
              seconds with exactly the format you approved.
            </p>
            <p>
              Ideal for open source maintainers and product teams who need reliable launch communication without more manual process.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6 py-8">
        <h2 className="font-[var(--font-heading)] text-2xl font-semibold text-white">Problem</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inconsistent habits</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300">
              Release comms depend on memory and whoever is online, so updates are delayed or skipped.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Channel mismatch</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300">
              Slack may get details, Twitter gets nothing, and mailing lists never hear about major releases.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lost engagement</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300">
              Users miss new features because announcements are late, fragmented, or absent.
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-6 py-8">
        <h2 className="font-[var(--font-heading)] text-2xl font-semibold text-white">Solution</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Webhook-driven fan-out</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300">
              A single GitHub release event triggers all enabled channels. Slack, Discord, Twitter, and email are delivered in one workflow.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Custom channel templates</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-300">
              Match each audience with the right tone and depth. Keep short social posts and detailed email summaries without duplicate work.
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-8" id="pricing">
        <Card className="border-emerald-800/70 bg-slate-900/80">
          <CardHeader>
            <CardTitle className="text-2xl">Simple pricing</CardTitle>
            <CardDescription>One plan for maintainers and product teams that need reliable release announcements.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-4xl font-bold text-white">$15<span className="text-lg text-slate-400">/month</span></p>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li>Unlimited release-triggered announcements</li>
                <li>Slack, Discord, Twitter, and email integrations</li>
                <li>Signed paywall access and delivery logs</li>
              </ul>
            </div>
            <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}>
              <Button size="lg">Buy with Stripe</Button>
            </a>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4 py-10">
        <h2 className="font-[var(--font-heading)] text-2xl font-semibold text-white">FAQ</h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <Card key={faq.question}>
              <CardHeader>
                <CardTitle className="text-base">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-slate-300">{faq.answer}</CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
