# CompetitorChange AI

> **"Know what your competitors changed. Know what you should do next."**

CompetitorChange AI is a production-ready SaaS platform that continuously monitors competitor websites and uses Google Gemini AI to explain:
1. **What changed?** (semantic business changes: pricing, services, promotions, FAQs, CTAs, headings)
2. **Why does the change matter?** (strategic business impact without speculation)
3. **How important is it?** (Low, Medium, High, Critical)
4. **What should your business do next?** (concrete, actionable recommendations)

---

## 1. Quick Setup & Architecture

This repository contains:
- **Frontend**: Modern React 19, TypeScript, Vite, Tailwind CSS, Lucide icons, Motion animations
- **Backend**: Node.js / Express server proxying Vite with secure server-side API endpoints
- **AI**: Google Gemini API (`gemini-3.8-flash`) using the `@google/genai` TypeScript SDK
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) policies
- **Crawler Abstraction**: Provider architecture supporting Firecrawl API with intelligent Demo fallback
- **Payments**: Cashfree Payments (India) with server-side order creation, cryptographic webhook signature verification, and idempotent event processing
- **Email**: Resend transactional email provider abstraction

---

## 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in the required variables:

```ini
# Supabase Configuration (Client & Backend)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" # Server-only

# AI Engine (Server-only)
GEMINI_API_KEY="your-gemini-api-key"

# Website Extraction (Server-only)
CRAWLER_API_KEY="your-firecrawl-api-key"
CRAWLER_PROVIDER="firecrawl" # or "demo"

# Cashfree Payments (Server-only)
CASHFREE_APP_ID="your-cashfree-app-id"
CASHFREE_SECRET_KEY="your-cashfree-secret-key"
CASHFREE_ENVIRONMENT="sandbox" # "sandbox" or "production"

# Email Delivery (Server-only)
RESEND_API_KEY="your-resend-api-key"

# Application URL
APP_URL="http://localhost:3000"
```

> **Security Mandate**: Never put `GEMINI_API_KEY`, `CASHFREE_SECRET_KEY`, `CRAWLER_API_KEY`, `RESEND_API_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` in frontend code or client bundles.

---

## 3. Database Setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Navigate to the **SQL Editor** tab.
3. Open `supabase/migrations/20260914000000_competitorchange_schema.sql`.
4. Run the complete SQL migration.
   - Creates all tables: `profiles`, `subscriptions`, `projects`, `competitors`, `scans`, `pages`, `changes`, `ai_insights`, `notifications`, `reports`, `payment_orders`, and `payment_events`.
   - Enables Row Level Security (RLS) on all user-owned tables.
   - Installs automatic profile & free-tier subscription triggers on `auth.users`.

---

## 4. Cashfree Payment Setup & Testing

CompetitorChange AI uses Cashfree PG API v2023-08-01 for India:

### Safe Sandbox Testing:
1. Sign up on the [Cashfree Merchant Dashboard](https://merchant.cashfree.com).
2. Switch to **Sandbox/Test** mode.
3. Copy your `Test App ID` and `Test Secret Key`.
4. Set `CASHFREE_ENVIRONMENT=sandbox` in `.env`.
5. When upgrading in the UI, Cashfree Test Mode will open. You can use Cashfree's test UPI IDs (e.g. `success@upi`) or test NetBanking / Cards to complete mock transactions.

### Webhook Configuration:
1. In the Cashfree dashboard, go to **Developers > Webhooks**.
2. Add a new endpoint: `https://your-domain.com/api/payments/cashfree-webhook`.
3. Select events: `ORDER_PAID`, `PAYMENT_SUCCESS_WEBHOOK`, `PAYMENT_FAILED_WEBHOOK`.
4. The server validates `x-webhook-signature` using HMAC-SHA256 with your `CASHFREE_SECRET_KEY` and logs every event idempotently in `payment_events`.

### Production Deployment:
1. Complete KYC verification on Cashfree.
2. In production, change `CASHFREE_ENVIRONMENT=production` and supply live credentials.

---

## 5. Website Crawler Configuration

The crawler abstraction (`src/server/crawler.ts`) supports:
- **Firecrawl API**: When `CRAWLER_API_KEY` is provided, fetches and scrapes live URLs, sanitizes HTML, ignores boilerplate navigation, and isolates semantic changes.
- **Demo Mode**: If no crawler API key is set, the system seamlessly uses realistic sample competitor snapshots (e.g., SmileCare Dental) so you can test scans, changes, and AI analysis immediately without third-party fees.

---

## 6. Running Locally

```bash
# Install dependencies
npm install

# Start development full-stack server (Port 3000)
npm run dev

# Run linting
npm run lint

# Build for production
npm run build

# Start production build
npm start
```
Open `http://localhost:3000` in your browser.
