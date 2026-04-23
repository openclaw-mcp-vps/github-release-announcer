"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AccessClaimFormProps {
  initialSessionId?: string;
  title?: string;
}

export function AccessClaimForm({ initialSessionId = "", title = "Unlock your dashboard" }: AccessClaimFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "idle" | "ok" | "error"; text: string }>({
    kind: "idle",
    text: ""
  });

  const nextPath = useMemo(() => searchParams.get("next") || "/dashboard", [searchParams]);

  async function claimAccess(event?: FormEvent) {
    event?.preventDefault();

    if (!sessionId.trim()) {
      setMessage({ kind: "error", text: "Enter your Stripe session ID first." });
      return;
    }

    setBusy(true);
    setMessage({ kind: "idle", text: "" });

    try {
      const response = await fetch("/api/access/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sessionId: sessionId.trim() })
      });

      const payload = (await response.json()) as { ok: boolean; message: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Could not verify purchase.");
      }

      setMessage({ kind: "ok", text: "Access granted. Redirecting to dashboard..." });
      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      setMessage({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Could not verify that checkout session. Make sure Stripe redirects with ?session_id={CHECKOUT_SESSION_ID}."
      });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (initialSessionId) {
      void claimAccess();
    }
  }, [initialSessionId]);

  return (
    <form className="space-y-4" onSubmit={claimAccess}>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
        <p className="text-sm text-slate-400">
          Paste the Stripe Checkout Session ID (starts with <code>cs_</code>) from your success URL.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="session-id">Stripe Session ID</Label>
        <Input
          id="session-id"
          value={sessionId}
          onChange={(event) => setSessionId(event.target.value)}
          placeholder="cs_test_a1b2c3..."
        />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? "Verifying..." : "Unlock Access"}
      </Button>
      {message.text ? (
        <p className={`text-sm ${message.kind === "error" ? "text-rose-400" : "text-emerald-400"}`}>
          {message.text}
        </p>
      ) : null}
    </form>
  );
}
