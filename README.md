# github-release-announcer

Auto-announce releases across all channels.

## What it does

When a GitHub release is published, this service verifies the webhook signature and fans out announcements to Slack, Discord, Twitter/X, and email with channel-specific templates.

## Stack

- Next.js 15 App Router + TypeScript
- Tailwind CSS v4
- shadcn-style UI components
- Webhook verification with `@octokit/webhooks` and HMAC checks
- File-based JSON persistence (`data/store.json`)

## Routes

- Landing page: `/`
- Paywall access page: `/access`
- Purchase completion handoff: `/purchase/success`
- Dashboard (paid): `/dashboard`
- Setup guide (paid): `/setup`

### API

- `GET /api/health` → `{ "status": "ok" }`
- `POST /api/webhook/github` (GitHub releases)
- `POST /api/webhook/stripe` (Stripe checkout session recording)
- `POST /api/access/claim` (redeem Stripe `session_id` to signed cookie)
- `POST /api/integrations/slack`
- `POST /api/integrations/discord`
- `POST /api/integrations/twitter`
- `POST /api/integrations/email`

## Local setup

1. Copy `.env.example` to `.env.local` and fill values.
2. Install dependencies:

```bash
npm install
```

3. Run dev server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Stripe payment flow

1. Set your Stripe Payment Link URL in `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`.
2. Configure Stripe Payment Link success URL as:

`https://YOUR_DOMAIN/purchase/success?session_id={CHECKOUT_SESSION_ID}`

3. Configure Stripe webhook endpoint:

`https://YOUR_DOMAIN/api/webhook/stripe`

with `checkout.session.completed` event and set `STRIPE_WEBHOOK_SECRET`.

4. After checkout, the user lands on `/purchase/success`, redeems the session ID, and receives a signed access cookie.
