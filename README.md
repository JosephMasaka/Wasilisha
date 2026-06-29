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

## Current Phase: Phase 1 - Foundation ✅

### Completed Features
- Next.js 15 project setup with TypeScript
- Prisma schema for all core models
- User authentication (signup/signin)
- Dashboard with wallet balance display
- Paystack M-Pesa wallet top-up integration
- Multi-tenancy architecture (company-scoped data)
- Webhook handling for payment confirmations

### Coming Next (Phase 2)
- Contact management + CSV upload
- SMS campaign creation and sending
- BullMQ queue setup + worker process
- Africa's Talking SMS integration
- Message status tracking

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL database
- Redis (for BullMQ queue)
- Paystack account (test mode for development)

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

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
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

⚠️ **Worker Process:** The BullMQ worker (for processing campaigns) cannot run on Vercel serverless functions. In Phase 2, you'll need to deploy the worker separately to Railway, Render, or EC2.

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

- **Phase 1:** Foundation (COMPLETE)
- **Phase 2:** SMS channel + queue system
- **Phase 3:** Email + WhatsApp channels
- **Phase 4:** Subscription plans + monetization
- **Phase 5:** Analytics + reliability
- **Phase 6:** Cross-channel automation

## Support

For issues or questions, refer to `wasilisha-dev-spec.md` for detailed architectural decisions and implementation patterns.

## License

Private - All rights reserved
