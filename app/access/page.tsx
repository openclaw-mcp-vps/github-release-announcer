import Link from "next/link";

import { AccessClaimForm } from "@/components/AccessClaimForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function AccessPage() {
  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
      <section className="space-y-5">
        <p className="text-sm uppercase tracking-widest text-sky-300">Paid Access</p>
        <h1 className="font-[var(--font-heading)] text-4xl font-bold leading-tight text-white">
          Unlock the release automation dashboard
        </h1>
        <p className="text-slate-300">
          Purchase once through Stripe, then redeem your checkout session to activate a signed access cookie for this browser.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK}>
            <Button size="lg">Buy for $15/mo</Button>
          </a>
          <Link href="/">
            <Button size="lg" variant="outline">
              Back to Landing Page
            </Button>
          </Link>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Redeem purchase</CardTitle>
          <CardDescription>
            After checkout, Stripe should redirect to this app with <code>session_id</code>. You can also paste it manually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccessClaimForm />
        </CardContent>
      </Card>
    </main>
  );
}
