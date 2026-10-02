# CompetitorChange AI

> **"Know what your competitors changed. Know what you should do next."**

CompetitorChange AI is an AI-powered competitive intelligence SaaS platform that continuously monitors competitor websites and explains:
1. **What changed?** (semantic business changes: pricing, services, promotions, FAQs, CTAs, headings)
2. **Why does the change matter?** (strategic business impact without speculation)
3. **How important is it?** (Low, Medium, High, Critical)
4. **What should your business do next?** (concrete, actionable recommendations)

---

## 1. Free Development Mode & Cost Protection

CompetitorChange AI is configured for **100% Free Development & Testing** without requiring any paid Google Cloud billing account or automated debit mandate.

- **Zero Cloud Billing Required**: Uses Google AI Studio free-tier Gemini API (`gemini-3.8-flash`) via the `@google/genai` TypeScript SDK.
- **Zero UPI Autopay / Zero ₹15,000 Mandate**: No automatic recurring billing mandate or Google Cloud UPI mandate exists or will ever be requested.
- **Application-Level Cost Safeguards**:
  - `FREE_DEVELOPMENT_MODE=true` (enforces daily quotas: max 25 AI requests/day, max 10 scans/day, 3 pages max per scan)
  - Strict crawl & AI request timeouts (5s & 12s)
  - Automatic fallback to deterministic domain intelligence if free AI quotas or rate limits are reached
  - User-friendly error messaging: *"AI analysis is temporarily unavailable because the current free usage limit has been reached. No paid service has been activated."*

---

## 2. Quick Setup & Architecture

- **Frontend**: Modern React 19, TypeScript, Vite, Tailwind CSS, Lucide icons, Motion animations
- **Backend**: Node.js / Express server proxying Vite with secure server-side API endpoints
- **AI**: Google Gemini API (`gemini-3.8-flash`) using `@google/genai` with deterministic fallback
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) policies
- **Crawler Abstraction**: Provider architecture with zero-cost built-in Demo crawler
- **Customer Payments**: Direct Google Pay / UPI QR code payment with manual UTR submission and Admin verification (no third-party paid gateway)
- **Email**: Optional Resend transactional email (simulated in console if omitted)

---

## 3. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Review the variables in `.env`:

```ini
# Free Development Mode (Active by default)
FREE_DEVELOPMENT_MODE=true
MAX_AI_REQUESTS_PER_USER_DAY=25
MAX_SCANS_PER_USER_DAY=10
MAX_PAGES_PER_SCAN=3

# Public Supabase Client (Optional for cloud sync)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Server Secrets (Private - Never exposed to frontend)
GEMINI_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRAWLER_PROVIDER=demo

# Customer UPI Payments Receiver (Google Pay / PhonePe / BHIM)
GPAY_UPI_ID=gugankousi5124@okaxis
GPAY_PAYEE_NAME=Gugan

# Optional Alert Email
RESEND_API_KEY=
APP_URL=https://competitorchangeai.netlify.app/
```

> **Security Mandate**: Never put `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or private credentials in frontend code or client bundles.

---

## 4. Customer UPI Payment System (Manual Verification)

CompetitorChange AI includes a customer-facing upgrade flow using standard Indian UPI (Google Pay, PhonePe, Paytm, BHIM):

1. **Customer View (`/billing`)**:
   - Customer selects a plan (e.g., Pro at ₹2,499/month).
   - The app displays the Payee VPA (`gugankousi5124@okaxis`), Payee Name (`Gugan`), exact amount, and QR code.
   - Customer scans the QR code or clicks the mobile deep link (`upi://pay?...`).
   - Customer inputs their 12-digit UPI Transaction Reference (UTR) number and submits the verification request.
   - Status is marked as `pending` (untrusted by default; no automatic upgrades without verification).

2. **Admin Verification (`/admin`)**:
   - Admin reviews submitted UTRs against bank statement credits.
   - Admin approves or rejects the request.
   - Upon approval, the user's subscription and higher plan limits are activated.

> **Crucial Distinction**: Customer software payments to the business are completely separate from Google Cloud infrastructure. No Google Cloud billing or UPI mandate is attached.

---

## 5. Automated Critical-Path Test Suite

To run the automated verification test suite covering authentication, project creation, change diffing, AI analysis, Row Level Security, and manual UPI flow:

- Open `/admin` in the app and click **Run Verification Suite**, or
- Make a `POST` request to `/api/tests/run`.


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
