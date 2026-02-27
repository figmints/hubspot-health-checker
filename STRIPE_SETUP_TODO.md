# Stripe Integration - Setup TODO

## Completed ✅

1. **Stripe Library** (`lib/stripe.ts`)
   - Product/price creation
   - Customer management
   - Checkout session creation
   - Billing portal integration
   - Webhook event verification

2. **API Endpoints**
   - `POST /api/checkout` - Create checkout session
   - `GET /api/checkout` - Check subscription status
   - `POST /api/webhook` - Handle Stripe events

3. **Database Schema** (in `lib/db.ts`)
   - `subscriptions` table with Stripe IDs
   - Premium status functions

4. **Premium Access Control**
   - `/api/fix` endpoint checks premium status
   - Results page shows upgrade modal
   - Dashboard shows subscription info

5. **UI Updates**
   - Landing page with FAQ section
   - Premium pricing with email input
   - Results page upgrade flow
   - Dashboard subscription management

## Remaining Setup ✋

### 1. Stripe Dashboard Configuration
Add to `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_BASE_URL=https://hubspot-health.figmints.net
```

### 2. Stripe Webhook
Create webhook in Stripe Dashboard pointing to:
`https://hubspot-health.figmints.net/api/webhook`

Events to listen for:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.trial_will_end`

### 3. Cloudflare Tunnel DNS
The DNS for `hubspot-health.figmints.net` needs to be configured to route to the tunnel.

In Cloudflare Dashboard:
1. Go to figmints.net DNS settings
2. Add CNAME record:
   - Name: `hubspot-health`
   - Target: `b1546b41-fd3c-4e3b-ae4f-6a6d8b120868.cfargotunnel.com`
   - Proxied: Yes

### 4. Start Tunnel
```bash
cd ~/.cloudflared
cloudflared tunnel --config config-hubspot-health.yml run b1546b41-fd3c-4e3b-ae4f-6a6d8b120868
```

### 5. Start Server
```bash
cd ~/projects/hubspot-health-checker
PORT=3470 npm start
```

## Test Checklist

- [ ] Landing page loads
- [ ] Free audit works
- [ ] Stripe checkout redirect works
- [ ] Webhook receives events
- [ ] Subscription creates successfully
- [ ] Premium features unlock
- [ ] Billing portal works
- [ ] Subscription cancellation works
