# Wasilisha - Multi-Channel Messaging Platform

**Reach Every Channel. One Platform.**

A multi-tenant SaaS platform for sending bulk SMS, email, and WhatsApp messages with unified wallet billing.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** NextAuth v5
- **Queue:** BullMQ + Redis
- **Payments:** Paystack (M-Pesa + Cards)
- **SMS:** Africa's Talking
- **Email:** Resend
- **WhatsApp:** Meta Business Cloud API

## Current Phase: Phase 5 - Analytics & Reliability ✅

### Phase 1 - Foundation ✅
- Next.js 15 project setup with TypeScript
- Prisma schema for all core models
- User authentication (signup/signin)
- Dashboard with wallet balance display
- Paystack M-Pesa wallet top-up integration
- Multi-tenancy architecture (company-scoped data)
- Webhook handling for payment confirmations

### Phase 2 - SMS Campaigns ✅
- Contact management with CSV upload & phone normalization
- SMS template builder with variables
- Campaign creation with cost estimation
- BullMQ queue + standalone worker process
- Africa's Talking SMS integration
- Delivery status tracking via webhooks
- Atomic wallet debits with row locking
- Real-time campaign progress monitoring

### Phase 3 - Multi-Channel Expansion ✅
- Email campaigns via Resend
- WhatsApp campaigns via Meta Business API
- Provider adapter abstraction layer
- HTML email support with subject customization
- Multi-channel worker with unified billing
- Channel-specific webhook handlers
- Per-channel cost calculation

### Phase 4 - Monetization Polish ✅
- Subscription plans (Starter/Growth/Scale)
- Included credits per channel
- Discounted overage rates
- Usage dashboard with charts
- Low-balance alerts
- Plan upgrade/downgrade
- Cancel anytime

### Phase 5 - Analytics & Reliability ✅
- Campaign analytics dashboard
- Delivery rate tracking
- Retry logic (up to 3 attempts)
- Failed messages monitor
- Dead letter queue
- Success rate visualization

### Coming Next (Phase 6)
- Cross-channel automation
- Fallback rules (WhatsApp → SMS)
- Multi-channel campaigns
- Conditional delivery logic
- A/B testing across channels

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL database
- Redis (for BullMQ queue) - **Required for Phase 2+**
- Paystack account (test mode for development)
- Africa's Talking account (sandbox mode for testing)
- Resend account (for email campaigns)
- Meta Business account (for WhatsApp campaigns)

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/wasilisha
   REDIS_URL=redis://localhost:6379

   NEXTAUTH_SECRET=your-super-secret-key-min-32-chars-long
   NEXTAUTH_URL=http://localhost:3000

   PAYSTACK_SECRET_KEY=sk_test_xxx
   PAYSTACK_PUBLIC_KEY=pk_test_xxx

   AFRICASTALKING_API_KEY=your_at_api_key
   AFRICASTALKING_USERNAME=sandbox

   RESEND_API_KEY=re_xxx

   WHATSAPP_BUSINESS_ACCOUNT_ID=your_whatsapp_business_account_id
   WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_random_verify_token

   APP_URL=http://localhost:3000
   ```

3. **Set up the database:**
   ```bash
   # Push schema to database
   npx prisma db push

   # Generate Prisma Client
   npx prisma generate
   ```

4. **Start Redis** (required for Phase 2 campaigns):
   ```bash
   # macOS
   brew services start redis
   
   # Linux
   sudo systemctl start redis
   
   # Windows: Use WSL or download from redis.io
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Start the worker** (required for sending campaigns):
   In a separate terminal:
   ```bash
   npm run worker
   ```

7. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Management

```bash
# Open Prisma Studio (visual DB editor)
npx prisma studio

# Create a new migration
npm run db:migrate

# Push schema changes without migration
npm run db:push

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Deploying to Vercel

### Prerequisites
- Vercel account
- PostgreSQL database (Supabase, Neon, or AWS RDS)
- Redis instance (Upstash Redis or Redis Cloud)

### Steps

1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Phase 1 complete"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables (copy all from `.env`)
   - Click "Deploy"

3. **Set up database:**
   ```bash
   # After deployment, run this locally to push schema to production DB
   DATABASE_URL="<production-database-url>" npx prisma db push
   ```

4. **Configure webhook URL:**
   - In your Vercel deployment, note the production URL (e.g., `https://wasilisha.vercel.app`)
   - Go to Paystack Dashboard → Settings → Webhooks
   - Add webhook URL: `https://wasilisha.vercel.app/api/webhooks/paystack`

### Environment Variables for Production

Update these in Vercel project settings:

- `DATABASE_URL` - Production PostgreSQL connection string
- `REDIS_URL` - Production Redis connection string
- `NEXTAUTH_URL` - Your production domain
- `NEXTAUTH_SECRET` - Generate a new secret for production
- `PAYSTACK_SECRET_KEY` - Use live keys for production
- All other provider API keys

### Important Notes

⚠️ **Worker Process:** The BullMQ worker (for processing campaigns) cannot run on Vercel serverless functions. Deploy the worker separately to Railway, Render, or EC2. See `PHASE-2-COMPLETE.md` for deployment instructions.

⚠️ **Webhook Testing:** Use ngrok or Vercel preview deployments to test webhooks locally:
```bash
ngrok http 3000
# Then use the ngrok URL in Paystack webhook settings
```

## Project Structure

```
app/
├── api/
│   ├── auth/              # Authentication endpoints
│   ├── wallet/            # Wallet management
│   └── webhooks/          # Provider webhooks
├── auth/                  # Auth pages (signin/signup)
├── dashboard/             # Protected dashboard pages
└── page.tsx               # Landing page

lib/
├── auth.ts                # NextAuth configuration
├── db.ts                  # Prisma client
└── paystack.ts            # Paystack API helpers

prisma/
└── schema.prisma          # Database schema

components/                # React components
```

## Multi-Tenancy Architecture

Every query is scoped by `company_id` derived from the authenticated session. This prevents data leakage between companies.

**Example:**
```typescript
const session = await auth();
const contacts = await prisma.contact.findMany({
  where: { companyId: session.user.companyId }, // Always filter by companyId
});
```

## Billing & Wallet

- Wallet balance stored as `Decimal` (not Float) to prevent rounding errors
- All wallet mutations use database transactions with row-level locking
- M-Pesa payments are asynchronous - balance updates only after webhook confirmation
- Never trust initial API responses - only verified webhooks update balance

## Security Checklist

- ✅ Multi-tenancy: All queries filtered by `company_id`
- ✅ Webhook verification: HMAC signature validation
- ✅ Password hashing: bcrypt with salt rounds
- ✅ SQL injection prevention: Prisma ORM
- ✅ Rate limiting: TODO (add in production)

## Development Workflow

Follow the phases in `wasilisha-dev-spec.md`:

- **Phase 1:** Foundation ✅ (COMPLETE)
- **Phase 2:** SMS channel + queue system ✅ (COMPLETE)
- **Phase 3:** Email + WhatsApp channels ✅ (COMPLETE)
- **Phase 4:** Subscription plans + monetization ✅ (COMPLETE)
- **Phase 5:** Analytics + reliability ✅ (COMPLETE)
- **Phase 6:** Cross-channel automation (NEXT - The Differentiator)

**Documentation:**
- **Phase 2:** `PHASE-2-COMPLETE.md` - SMS campaigns
- **Phase 3:** `PHASE-3-COMPLETE.md` - Email & WhatsApp
- **Phase 4:** `PHASE-4-COMPLETE.md` - Subscription & usage tracking
- **Phase 5:** `PHASE-5-COMPLETE.md` - Analytics & reliability

## Troubleshooting

### Dashboard loading indefinitely

Run the setup checker to diagnose issues:
```bash
npm run check
```

Common causes:
1. **Database not connected:** Verify `DATABASE_URL` in `.env`
2. **Prisma client not generated:** Run `npx prisma generate`
3. **Missing AUTH_SECRET:** Add both `NEXTAUTH_SECRET` and `AUTH_SECRET` to `.env`
4. **Database tables not created:** Run `npm run db:push`

### Quick fixes:

```bash
# Regenerate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Check if PostgreSQL is running (Windows with XAMPP)
# Start XAMPP Control Panel and start PostgreSQL

# Test database connection
npx prisma studio
```

### Auth issues

If you're getting redirected to signin repeatedly:
1. Ensure `AUTH_SECRET` is set in `.env` (required for NextAuth v5)
2. Clear browser cookies and try again
3. Check browser console for errors

### Missing environment variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Then edit `.env` with your actual credentials.

## Support

For issues or questions, refer to `wasilisha-dev-spec.md` for detailed architectural decisions and implementation patterns.

## License

Private - All rights reserved
