# Wasilisha - Quick Setup Guide

## 🚀 Serving Locally (Development)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Environment Variables
Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

**Minimum required for Phase 1:**
```env
# Database (required)
DATABASE_URL=postgresql://user:password@localhost:5432/wasilisha

# Redis (optional for Phase 1, required for Phase 2)
REDIS_URL=redis://localhost:6379

# Auth (required)
NEXTAUTH_SECRET=generate-a-random-32-char-string-here
NEXTAUTH_URL=http://localhost:3000

# Paystack (required for wallet)
PAYSTACK_SECRET_KEY=sk_test_your_test_key
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key

# Provider APIs (optional for Phase 1)
AFRICASTALKING_API_KEY=sandbox_key
AFRICASTALKING_USERNAME=sandbox
RESEND_API_KEY=re_xxx
```

**Generate NEXTAUTH_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Set Up Database

**Option A - Using local PostgreSQL:**
```bash
# Start PostgreSQL
# Create database: wasilisha

# Push schema
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

**Option B - Using Supabase (free tier):**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection string from Settings → Database
4. Add to `.env` as `DATABASE_URL`
5. Run: `npx prisma db push`

### Step 4: Start Development Server
```bash
npm run dev
```

### Step 5: Access Application
Open [http://localhost:3000](http://localhost:3000)

- Click "Get Started" to create an account
- Sign up with company name, email, and password
- You'll be redirected to the dashboard
- Test wallet top-up (requires Paystack test keys)

---

## ☁️ Deploying to Vercel (Production)

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- Production PostgreSQL database
- Production Redis instance (for Phase 2+)

### Step 1: Prepare Repository
```bash
# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Phase 1: Foundation complete"

# Create GitHub repo and push
git remote add origin https://github.com/yourusername/wasilisha.git
git branch -M main
git push -u origin main
```

### Step 2: Set Up Production Database

**Option A - Supabase (Recommended for MVP):**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection string from Settings → Database → Connection string → URI
4. Save for Vercel environment variables

**Option B - Neon (Also free tier):**
1. Go to [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Save for Vercel environment variables

### Step 3: Deploy to Vercel

**Using Vercel CLI (Recommended):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? wasilisha
# - Directory? ./
# - Override settings? No
```

**Using Vercel Dashboard:**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Framework Preset: Next.js (auto-detected)
4. Click "Deploy"

### Step 4: Configure Environment Variables in Vercel

**Via Vercel Dashboard:**
1. Go to your project → Settings → Environment Variables
2. Add each variable from your `.env` file:

```
DATABASE_URL=<production-postgresql-url>
REDIS_URL=<production-redis-url>
NEXTAUTH_SECRET=<generate-new-for-production>
NEXTAUTH_URL=https://your-app.vercel.app
PAYSTACK_SECRET_KEY=sk_live_xxx  (use live keys!)
PAYSTACK_PUBLIC_KEY=pk_live_xxx
AFRICASTALKING_API_KEY=<live-key>
AFRICASTALKING_USERNAME=<your-username>
RESEND_API_KEY=re_xxx
APP_URL=https://your-app.vercel.app
```

**Via CLI:**
```bash
vercel env add DATABASE_URL
# Paste value when prompted
# Repeat for each variable
```

### Step 5: Push Database Schema to Production
```bash
# Run locally with production DATABASE_URL
DATABASE_URL="<your-production-db-url>" npx prisma db push
```

### Step 6: Configure Paystack Webhook

1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Settings → Webhooks
3. Add webhook URL:
   ```
   https://your-app.vercel.app/api/webhooks/paystack
   ```
4. Save webhook URL

### Step 7: Test Production Deployment

1. Visit your Vercel URL
2. Create a test account
3. Test wallet top-up with Paystack test card:
   - Card: 4084 0840 8408 4081
   - Expiry: Any future date
   - CVV: 408
   - OTP: 123456

---

## 🧪 Testing Webhooks Locally

Paystack needs a public URL to send webhooks. Use ngrok:

### Step 1: Install ngrok
```bash
# Download from ngrok.com or:
npm install -g ngrok
```

### Step 2: Start ngrok tunnel
```bash
# In a separate terminal while your app runs on localhost:3000
ngrok http 3000
```

### Step 3: Configure Paystack
Copy the ngrok HTTPS URL (e.g., `https://abc123.ngrok.io`) and add to Paystack:
```
https://abc123.ngrok.io/api/webhooks/paystack
```

### Step 4: Test
- Make a wallet top-up
- Check ngrok dashboard to see incoming webhook
- Verify balance updates

---

## 📦 Database Commands

```bash
# View database in browser
npx prisma studio

# Create migration (when schema changes)
npx prisma migrate dev --name description

# Push schema without migration
npx prisma db push

# Generate Prisma Client (after schema changes)
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

---

## 🔧 Troubleshooting

### Issue: "PrismaClient is not configured"
**Solution:** Run `npx prisma generate`

### Issue: "Can't reach database server"
**Solution:** Check `DATABASE_URL` format:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

### Issue: "NEXTAUTH_URL missing"
**Solution:** Add to `.env`:
```
NEXTAUTH_URL=http://localhost:3000
```

### Issue: Webhook not receiving events
**Solution:**
- For local: Use ngrok tunnel
- For production: Verify URL in Paystack dashboard
- Check webhook logs in Paystack dashboard

### Issue: Build fails on Vercel
**Solution:**
- Check environment variables are set
- Verify `DATABASE_URL` is accessible from Vercel
- Check build logs for specific errors

---

## 📝 Next Steps

**Phase 1 Complete ✅** - You now have:
- Authentication system
- Dashboard with wallet display
- M-Pesa wallet top-up via Paystack
- Multi-tenant architecture

**Phase 2 Next** - To implement:
- Contact management + CSV upload
- SMS campaign creation
- BullMQ queue + worker process
- Africa's Talking integration
- Message delivery tracking

Refer to `wasilisha-dev-spec.md` for detailed Phase 2 requirements.

---

## 🆘 Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npx prisma studio        # Visual DB editor
npx prisma db push       # Push schema to DB
npx prisma generate      # Generate Prisma Client

# Deployment
vercel                   # Deploy to Vercel
vercel --prod            # Deploy to production
vercel env pull          # Pull env variables locally
```

---

## 📞 Support

- **Spec Reference:** See `wasilisha-dev-spec.md`
- **Architecture:** See README.md
- **API Docs:** 
  - Paystack: https://paystack.com/docs/api
  - Africa's Talking: https://developers.africastalking.com
