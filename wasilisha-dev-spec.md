# Wasilisha — Development Specification

> **Purpose of this file:** This is the authoritative build spec for Claude Code (CLI). Read this entire file before writing any code. Follow the phase order. Do not skip the architectural invariants marked ⚠️ — they are non-negotiable and exist because of real failure modes in this exact type of system (wallet billing + async payment webhooks + bulk message queues).

---

## 1. Product Summary

**Name:** Wasilisha (Swahili: "to deliver / convey / transmit")
**Tagline:** Reach Every Channel. One Platform.

**What it is:** A multi-tenant SaaS platform that lets businesses send bulk SMS, bulk email, and WhatsApp messages through one unified dashboard and API, billed through a hybrid wallet (pay-as-you-go) + subscription model.

**Target market:** Kenya-first, East Africa next, global-ready architecture.

**Core value proposition vs. competitors (Africa's Talking, Celcom Africa, etc.):**
- One platform for all three channels instead of three separate tools
- One wallet, one set of contacts, one set of templates across channels
- Cross-channel automation as the long-term differentiator (e.g., "send via WhatsApp; if unread after 10 minutes, fall back to SMS automatically") — build this AFTER the MVP core is solid, see Phase 6

---

## 2. Tech Stack (Locked Decisions — do not substitute without asking)

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 15, App Router | Single deployable for frontend + API routes |
| Language | TypeScript (strict mode) | No `any` types in core billing/queue logic |
| Database | PostgreSQL | Use Supabase or AWS RDS. Never substitute a NoSQL store for wallet/transaction tables |
| ORM | Prisma | Type-safe queries, migration history |
| Queue | BullMQ on Redis | Required for all bulk sends — see §5 |
| Background worker | Standalone Node.js process | Cannot run inside Vercel serverless functions — see §5 |
| Auth | Auth.js (NextAuth v5) | Credentials + session-based, company-scoped |
| SMS provider | Africa's Talking | Primary. Kenya-optimized routing |
| Email provider | Resend | Best DX for MVP speed; AWS SES is a valid swap at higher volume |
| WhatsApp provider | Meta WhatsApp Business Cloud API | Direct integration, not a reseller — avoids markup-on-markup |
| Payments — wallet top-up | **Paystack** (Charge API, `mobile_money` object, provider `mpesa`) | Replaces Daraja STK Push directly. See §6 |
| Payments — subscriptions | Paystack Subscriptions API | Card-based recurring billing; M-Pesa does not support recurring charges, so subscription renewal must prompt a fresh STK push or use card |
| Hosting — app | Vercel | Frontend + API routes |
| Hosting — worker | Railway, Render, or a small EC2 instance | Needs to run continuously, unlike Vercel functions |
| Styling | Tailwind CSS | Use design tokens, no inline magic numbers |

---

## 3. Multi-Tenancy Model

Single shared database, discriminated by `company_id` on every tenant-scoped table. This mirrors the proven pattern already used in production on AssetIQ (Joseph's other SaaS product) — replicate the same discipline here:

- Every query touching tenant data MUST filter by `company_id`
- Every new controller/route handler should have a `authorizeCompany()`-equivalent guard at the top before any DB access
- Never trust a `company_id` passed in a request body — always derive it from the authenticated session

⚠️ **This is the single most common multi-tenant SaaS bug class: a missing `company_id` filter leaking one company's contacts, messages, or wallet balance to another. Every new table and every new query must be reviewed against this before merging.**

---

## 4. Database Schema (Prisma)

Build this schema first, in this order. Each phase below references these tables.

```prisma
model Company {
  id                  String    @id @default(uuid())
  name                String
  email               String    @unique
  walletBalance       Int       @default(0) // stored in lowest currency unit (cents/kobo equivalent for KES = whole shillings *100 if you want precision, decide and document — see note below)
  subscriptionPlanId  String?
  subscriptionPlan    SubscriptionPlan? @relation(fields: [subscriptionPlanId], references: [id])
  subscriptionStatus  String?   // active | past_due | cancelled | none
  senderIdSms         String?   // approved Sender ID for SMS
  paystackCustomerCode String?  // returned by Paystack on first charge, reuse for recurring
  createdAt           DateTime  @default(now())
  users               User[]
  contacts            Contact[]
  contactLists        ContactList[]
  campaigns           Campaign[]
  templates           Template[]
  walletTransactions  WalletTransaction[]
}

model User {
  id          String   @id @default(uuid())
  email       String   @unique
  passwordHash String
  role        String   // owner | admin | member
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  createdAt   DateTime @default(now())
}

model SubscriptionPlan {
  id               String  @id @default(uuid())
  name             String  // e.g. "Starter", "Growth", "Scale"
  monthlyPriceKes  Int
  includedSmsCredits     Int
  includedEmailCredits   Int
  includedWhatsappCredits Int
  overageRateSms     Decimal // KES per SMS after included credits used
  overageRateEmail   Decimal
  overageRateWhatsapp Decimal
  companies        Company[]
}

model WalletTransaction {
  id          String   @id @default(uuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  type        String   // topup | debit | refund
  amountKes   Decimal
  channel     String?  // sms | email | whatsapp | null for topups
  paystackReference String? // for topups, the Paystack transaction reference
  status      String   // pending | success | failed
  createdAt   DateTime @default(now())

  @@index([companyId])
}

model Contact {
  id           String   @id @default(uuid())
  companyId    String
  company      Company  @relation(fields: [companyId], references: [id])
  phone        String?
  email        String?
  whatsappId   String?
  customFields Json?
  tags         String[]
  createdAt    DateTime @default(now())

  @@index([companyId])
}

model ContactList {
  id        String   @id @default(uuid())
  companyId String
  company   Company  @relation(fields: [companyId], references: [id])
  name      String
  createdAt DateTime @default(now())
}

model Template {
  id        String   @id @default(uuid())
  companyId String
  company   Company  @relation(fields: [companyId], references: [id])
  channel   String   // sms | email | whatsapp
  name      String
  content   String   @db.Text
  variables Json?    // e.g. ["first_name", "order_id"]
  createdAt DateTime @default(now())
}

model Campaign {
  id           String    @id @default(uuid())
  companyId    String
  company      Company   @relation(fields: [companyId], references: [id])
  channel      String    // sms | email | whatsapp
  name         String
  templateId   String?
  status       String    // draft | scheduled | sending | completed | failed
  scheduledAt  DateTime?
  createdAt    DateTime  @default(now())
  messages     Message[]
}

model Message {
  id                String   @id @default(uuid())
  campaignId        String
  campaign          Campaign @relation(fields: [campaignId], references: [id])
  contactId         String
  channel           String   // sms | email | whatsapp
  status            String   // queued | sent | delivered | failed | bounced
  providerMessageId String?  // ID returned by Africa's Talking / Resend / Meta
  costKes           Decimal
  errorMessage      String?
  sentAt            DateTime?
  deliveredAt       DateTime?
  createdAt         DateTime @default(now())

  @@index([campaignId])
}

model ProviderWebhookLog {
  id          String   @id @default(uuid())
  source      String   // paystack | africastalking | resend | whatsapp
  rawPayload  Json
  processedAt DateTime?
  createdAt   DateTime @default(now())
}
```

**Decide and document immediately:** store all monetary amounts as `Decimal` (Prisma's `Decimal` type backed by Postgres `numeric`), never `Float`. Floating point currency math causes drift bugs. This applies to `walletBalance`, all rate fields, and `costKes`.

---

## 5. Queue Architecture — Required Reading Before Phase 2

⚠️ **Bulk sends must never be processed synchronously inside a Next.js API route.** A campaign to 5,000 contacts will time out any serverless function and will not survive a deploy or cold start mid-send.

**Correct flow:**
1. User clicks "Send Campaign" → Next.js API route validates the campaign, checks wallet/subscription balance is sufficient for the full send, creates `Message` rows with status `queued`, and enqueues one BullMQ job **per message** (or per batch of ~100) onto a Redis-backed queue.
2. A separate, always-running Node.js worker process (NOT a Vercel function) consumes the queue, calls the relevant provider API (Africa's Talking / Resend / Meta) for each message, and updates the `Message` row status.
3. Providers send delivery confirmations asynchronously via webhook (Africa's Talking delivery reports, Resend webhooks, Meta WhatsApp status callbacks) → a Next.js API route receives these, logs the raw payload to `ProviderWebhookLog`, and updates the matching `Message.status` to `delivered` or `failed`.

**Where to deploy the worker:** Railway or Render (simplest), or a small EC2 instance if Joseph wants to reuse existing AWS familiarity from AssetIQ. The worker needs:
- Same `DATABASE_URL` and `REDIS_URL` as the main app
- Provider API keys
- Independent process supervision (e.g. `pm2` if on EC2, or the platform's built-in restart policy)

---

## 6. Payments — Paystack Integration (Replaces M-Pesa Daraja)

### 6.1 Why Paystack instead of direct Daraja
Direct Safaricom Daraja integration requires business paperwork, a registered Paybill/Till, a publicly accessible SSL server for callbacks, and meaningfully more setup time. For an MVP, Paystack wraps M-Pesa STK Push (plus cards, bank transfer, and Pesalink) behind one clean API and one webhook contract. Migrate to direct Daraja later only if/when transaction volume justifies removing Paystack's per-transaction fee.

### 6.2 Wallet Top-Up Flow (M-Pesa via Paystack)

**Step 1 — Initiate charge.** Server-side API route calls Paystack's Charge endpoint:

```
POST https://api.paystack.co/charge
Authorization: Bearer {PAYSTACK_SECRET_KEY}
Content-Type: application/json

{
  "email": "<company billing email>",
  "amount": "<amount in KES, then x100 — Paystack expects the smallest currency unit>",
  "currency": "KES",
  "mobile_money": {
    "phone": "+254712345678",
    "provider": "mpesa"
  }
}
```

- Always format the phone number as `+254XXXXXXXXX`. If the user enters `07XXXXXXXX`, strip the leading `0` and prepend `+254` server-side before sending.
- The initial response will return `data.status = "pay_offline"` or similar pending status — **this does NOT mean payment succeeded.** The customer must still authorize the STK push on their phone.
- Create a `WalletTransaction` row immediately with `status = "pending"` and the Paystack reference, BEFORE the webhook arrives. This row is what the UI polls/displays while the user is completing the prompt on their phone.

**Step 2 — Wait for webhook, not the initial response.**

```
POST /api/webhooks/paystack   (your Next.js API route)
```

- Paystack will POST a `charge.success` event (or a failure event) to this endpoint once the customer completes or abandons the STK prompt.
- ⚠️ **Verify the webhook signature** using the `x-paystack-signature` header (HMAC SHA512 of the raw request body using your Paystack secret key) before trusting any payload. Reject anything that doesn't match.
- On a verified `charge.success` event: inside a single database transaction, (a) update the matching `WalletTransaction.status` to `success`, and (b) increment `Company.walletBalance` by the transaction amount, using `SELECT ... FOR UPDATE` row locking on the `Company` row to prevent race conditions if multiple top-ups or debits happen concurrently.
- Log every raw webhook payload to `ProviderWebhookLog` regardless of outcome, for audit/debugging.

**Step 3 — Handle the timeout/abandon case.** If a customer closes the STK prompt without entering their PIN, no webhook may ever arrive, or it may arrive with a failure status. Implement a fallback: if a `WalletTransaction` has been `pending` for more than ~2 minutes, call Paystack's Verify Transaction endpoint (`GET /transaction/verify/:reference`) server-side to check the actual status and reconcile, rather than leaving it pending forever. Run this as a scheduled job (every minute) checking for stale pending transactions.

⚠️ **Never increment wallet balance from the initial charge response. Only the verified webhook (or a verified manual reconciliation check) is a source of truth, because M-Pesa STK Push is fully asynchronous — the customer authorizes on their phone, completely outside your request/response cycle.**

### 6.3 Debiting the Wallet on Message Send

When the queue worker successfully sends a message and is about to record its cost:

```sql
BEGIN;
SELECT wallet_balance FROM "Company" WHERE id = $companyId FOR UPDATE;
-- check balance >= cost in application code
UPDATE "Company" SET wallet_balance = wallet_balance - $cost WHERE id = $companyId;
INSERT INTO "WalletTransaction" (...) VALUES (..., 'debit', $cost, ...);
COMMIT;
```

⚠️ This row-locking pattern is required because campaigns send many messages concurrently through the queue — without `FOR UPDATE`, concurrent debits against the same company can race and corrupt the balance (classic lost-update bug). This is the same invariant already validated in production for AssetIQ's Components module (`ComponentActionService` with `lockForUpdate()`) — apply that exact discipline here.

If a campaign would exceed the available wallet balance + remaining subscription credits, reject the send at validation time (Phase 1 of the queue flow in §5), not partway through.

### 6.4 Subscription Billing

M-Pesa cannot do recurring/automatic billing — there is no equivalent of a card's recurring mandate. For subscription plans:
- Prefer card payment via Paystack Subscriptions API for true auto-renewal, OR
- For M-Pesa-only customers, send a renewal reminder a few days before the billing date and trigger a fresh STK push charge for the subscription amount, falling back to wallet-style top-up flow (§6.2) for renewal
- Decide which approach to build first based on whether early customers prefer card or M-Pesa — default to building M-Pesa-style manual renewal first since it's already built in §6.2, then add card subscriptions in Phase 4

---

## 7. Build Phases — Follow This Order

### Phase 1 — Foundation
- Next.js project scaffold, TypeScript strict mode, Tailwind setup
- Prisma schema from §4, run initial migration
- Auth.js setup: signup creates a `Company` + first `User` (role `owner`) together in one transaction
- Dashboard shell with wallet balance display (read-only for now)
- Paystack wallet top-up flow end-to-end per §6.2, including the webhook handler and the stale-pending reconciliation job
- **Done when:** a new company can sign up, see a KES 0 wallet, top up via M-Pesa STK push, and see the balance update after completing the prompt on their phone

### Phase 2 — Single Channel Proof (SMS only)
- Contact model + CSV upload UI (parse, validate phone numbers, dedupe)
- Template builder for SMS (plain text, variable placeholders like `{{first_name}}`)
- Campaign creation flow: select template + contact list → review estimated cost (contacts × per-SMS rate) → confirm send
- BullMQ queue setup (§5) + standalone worker process talking to Africa's Talking's SMS API
- Africa's Talking delivery report webhook → update `Message.status`
- Wallet debit per message per §6.3
- **Done when:** a campaign of 50+ test contacts sends via SMS, wallet debits correctly per message even under concurrent load, and delivery statuses update from webhook callbacks

This phase is the hardest and most important — it proves the entire architecture (queue, billing, webhooks) end to end. Email and WhatsApp in Phase 3 reuse this same skeleton with different provider adapters.

### Phase 3 — Multi-Channel Expansion
- Add Email channel: Resend integration, HTML template support, open/click tracking via Resend webhooks
- Add WhatsApp channel: Meta WhatsApp Business Cloud API integration
  - ⚠️ WhatsApp requires Meta template pre-approval before you can send templated messages to users who haven't messaged you first — start this approval process in parallel with development, it has unpredictable lead time
- Both channels plug into the same `Campaign` / `Message` / queue abstraction from Phase 2 — same `channel` enum, different provider adapter function, same billing logic
- Build a thin internal "provider adapter" interface (e.g. `sendMessage(channel, contact, content): Promise<ProviderResult>`) so adding a future channel doesn't require touching the queue or billing logic

### Phase 4 — Monetization Polish
- Subscription plans: plan selection UI, Paystack Subscriptions integration for card-based renewal (§6.4)
- Usage dashboard: credits remaining (subscription) vs wallet balance, cost breakdown per campaign
- Low-balance email/SMS alert when wallet drops below a configurable threshold
- Downloadable receipts/invoices for top-ups and subscription charges

### Phase 5 — Analytics & Reliability
- Campaign-level analytics: delivery rate, failure rate, cost per campaign, open/click rate for email
- Retry logic for failed sends (configurable max retries with backoff in the BullMQ job)
- Admin-facing dead-letter view for permanently failed messages

### Phase 6 — Differentiation (Post-MVP)
- Cross-channel fallback automation: e.g. "Send via WhatsApp. If undelivered/unread after N minutes, automatically resend via SMS." This requires tracking WhatsApp read receipts (available via Meta's webhook) and a delayed BullMQ job that checks status before triggering the fallback send.
- AI-assisted campaign copy (reuse the Groq integration pattern already proven on AssetIQ): generate SMS/WhatsApp copy in English and Swahili from a short prompt, with a character-count-aware SMS variant.
- Smart send-time optimization based on historical delivery/open data per contact.

---

## 8. Non-Negotiable Engineering Standards (apply throughout all phases)

1. **Multi-tenancy:** every query scoped by `company_id`, derived from session, never from request body (§3).
2. **Money handling:** `Decimal` type everywhere, never `Float`, for all currency fields.
3. **Wallet mutations:** always inside a DB transaction with row-level locking (`FOR UPDATE` equivalent), never a plain `UPDATE` without a preceding lock when concurrent writers are possible (§6.3).
4. **Webhook trust:** verify Paystack's `x-paystack-signature` HMAC on every incoming webhook before acting on it. Apply the same signature/verification discipline to Meta and Resend webhooks where they offer one.
5. **Async payment confirmation:** never treat an initial API response as proof of payment for M-Pesa flows — only a verified webhook or a verified manual reconciliation check counts (§6.2).
6. **Bulk operations:** never process bulk sends synchronously in a request/response cycle — always queue (§5).
7. **Idempotency:** webhook handlers must be safe to receive the same event twice (Paystack and most providers can retry webhook delivery) — check if the event/reference has already been processed before applying changes again.
8. **TypeScript strictness:** no `any` in billing, queue, or webhook code paths.

---

## 9. Environment Variables (define early)

```
DATABASE_URL=
REDIS_URL=
NEXTAUTH_SECRET=
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
AFRICASTALKING_API_KEY=
AFRICASTALKING_USERNAME=
RESEND_API_KEY=
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
APP_URL=
```

---

## 10. How to Use This File With Claude Code

- Feed this entire file as context at the start of a Claude Code session for this project.
- Work phase by phase. Do not let Claude Code jump ahead to Phase 3 features while Phase 2 is unfinished — the queue/billing/webhook skeleton proven in Phase 2 is what every later phase depends on.
- When asking Claude Code to implement a phase, reference the section numbers directly (e.g. "Implement Phase 2 per §7, following the wallet debit pattern in §6.3 and the queue architecture in §5").
- Re-paste this file (or the relevant section) into context if the session runs long — don't rely on Claude Code remembering earlier architectural decisions across a long session without it being restated.
