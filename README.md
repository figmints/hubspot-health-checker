# HubSpot Health Checker

A free web app that analyzes HubSpot CRM instances and provides a health score with actionable recommendations. Premium tier offers automated issue fixing.

**Live:** https://hubspot-health.figmints.net

## Features

### Free Tier
- 🔐 Secure OAuth 2.0 integration with HubSpot
- 📊 Comprehensive CRM health scoring (0-100)
- 📈 5-category breakdown:
  - Contact Data Quality (25 pts)
  - Deal Pipeline Health (25 pts)
  - Company Data Quality (20 pts)
  - Engagement Health (15 pts)
  - Data Hygiene (15 pts)
- 💡 Actionable recommendations
- 📧 Lead capture form
- 📱 Mobile responsive design
- ⚡ Fast results (< 30 seconds)

### Premium Tier ($99/mo)
- 🔧 **Automated Issue Fixing** - One-click remediation for:
  - Duplicate contacts/companies (merge)
  - Inconsistent name formatting
  - Phone number standardization
  - Orphan contact archiving
  - Stale deal archiving
- 📈 **Historical Score Tracking** - See trends over time
- 🔔 **Proactive Monitoring** - Daily scans with alerts
- 📋 **PDF Health Reports** - Export for clients/leadership
- 💬 **Priority Support**

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Styling:** Tailwind CSS
- **Authentication:** HubSpot OAuth 2.0
- **Session Management:** iron-session
- **API Client:** Axios

## Setup

### 1. Create HubSpot App

1. Go to [developers.hubspot.com](https://developers.hubspot.com)
2. Create a new app called "HubSpot Health Checker"
3. Set redirect URI to: `http://localhost:3000/api/auth/callback` (update for production)
4. Request these scopes:
   - `crm.objects.contacts.read`
   - `crm.objects.companies.read`
   - `crm.objects.deals.read`
   - `crm.schemas.contacts.read`
5. Copy your Client ID and Client Secret

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
# HubSpot OAuth
HUBSPOT_CLIENT_ID=your_client_id
HUBSPOT_CLIENT_SECRET=your_client_secret
HUBSPOT_REDIRECT_URI=http://localhost:3000/api/auth/callback
SESSION_SECRET=any-random-secret-key

# Stripe (for Premium tier)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Set Up Stripe (for Premium features)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your API keys (use test keys for development)
3. Create a webhook endpoint pointing to `/api/webhook`:
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.trial_will_end`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

The app will automatically create the Premium product/price on first checkout.

### 4. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

## Deployment to Vercel

### Option 1: Use Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option 2: Connect GitHub

1. Push to GitHub
2. Import in Vercel dashboard
3. Add environment variables
4. Update HubSpot redirect URI to: `https://your-app.vercel.app/api/auth/callback`

### Environment Variables for Vercel

```
HUBSPOT_CLIENT_ID=your_production_client_id
HUBSPOT_CLIENT_SECRET=your_production_client_secret
HUBSPOT_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
SESSION_SECRET=your-production-secret-key
```

## Project Structure

```
app/
├── api/
│   ├── audit/
│   │   ├── route.ts       # Main audit endpoint
│   │   └── results/
│   │       └── route.ts   # Results storage/retrieval
│   └── auth/
│       ├── hubspot/
│       │   └── route.ts   # OAuth initiation
│       └── callback/
│           └── route.ts   # OAuth callback handler
├── audit/
│   └── page.tsx           # Audit progress page
├── results/
│   └── page.tsx           # Results display page
├── page.tsx               # Landing page
├── layout.tsx             # Root layout
└── globals.css            # Global styles

lib/
├── audit.ts               # Audit scoring logic
├── hubspot.ts             # HubSpot API client
└── session.ts             # Session management
```

## Audit Scoring Details

### Contact Data Quality (25 pts)
- Email fill rate: 5 pts
- Name fill rate: 5 pts
- Company association: 5 pts
- Industry: 5 pts
- Lead status: 5 pts

### Deal Pipeline Health (25 pts)
- Stale deals (30+ days): 10 pts
- Deal amount fill rate: 5 pts
- Close date fill rate: 5 pts
- Stage distribution: 5 pts

### Company Data Quality (20 pts)
- Industry fill rate: 5 pts
- Employee count: 5 pts
- Revenue fill rate: 5 pts
- Website/domain: 5 pts

### Engagement Health (15 pts)
- Email engagement (90 days): 8 pts
- Sales involvement: 7 pts

### Data Hygiene (15 pts)
- Orphan contacts: -1 pt per 10%
- Potential duplicates: -1 pt per 5%

## API Reference

### GET /api/auth/hubspot
Initiates OAuth flow. Redirects to HubSpot authorization.

### GET /api/auth/callback
Handles OAuth callback, exchanges code for token.

### GET /api/audit
Runs full audit, returns score and breakdown.

Parameters: None (uses session token)

Response:
```json
{
  "overallScore": 75,
  "categories": [
    {
      "name": "Contact Data Quality",
      "score": 20,
      "maxPoints": 25,
      "description": "...",
      "details": ["..."]
    }
  ],
  "issues": ["..."],
  "recommendations": ["..."]
}
```

### GET/POST /api/audit/results
Get or save audit results in session.

### GET /api/fix
Returns list of fixable issues detected in HubSpot data.

### POST /api/fix
Executes a fix for a specific issue (Premium only).

Parameters:
```json
{
  "issueId": "duplicate_contacts",
  "portalId": "your-portal-id"
}
```

### POST /api/checkout
Creates a Stripe checkout session for Premium subscription.

Parameters:
```json
{
  "email": "user@example.com",
  "portalId": "your-portal-id",
  "action": "checkout" // or "manage" for billing portal
}
```

### POST /api/webhook
Handles Stripe webhook events (subscription lifecycle).

## Contributing

This is a Figmints tool. For questions or improvements, contact the dev team.

## License

Proprietary - Figmints 2025
