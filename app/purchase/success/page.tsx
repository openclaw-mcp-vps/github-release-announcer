import { AccessClaimForm } from "@/components/AccessClaimForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PurchaseSuccessPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = "force-dynamic";

export default async function PurchaseSuccessPage({ searchParams }: PurchaseSuccessPageProps) {
  const params = await searchParams;
  const sessionId = typeof params.session_id === "string" ? params.session_id : "";

  return (
    <main className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Payment received</CardTitle>
          <CardDescription>
            Final step: redeem this checkout session to activate dashboard access on this browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccessClaimForm initialSessionId={sessionId} title="Activate dashboard access" />
        </CardContent>
      </Card>
    </main>
  );
}
