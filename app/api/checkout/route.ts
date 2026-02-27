import { NextResponse } from 'next/server';
import { 
  createCustomer, 
  createCheckoutSession, 
  createBillingPortalSession,
  getCustomerByEmail,
  getCustomerActiveSubscription 
} from '@/lib/stripe';
import { 
  getOrCreateWorkspace, 
  getOrCreateSubscription,
  getSubscriptionByWorkspace,
  isPremiumByPortalId 
} from '@/lib/db';

/**
 * POST /api/checkout
 * Creates a Stripe checkout session for premium subscription
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, portalId, name, action = 'checkout' } = body;

    if (!email || !portalId) {
      return NextResponse.json(
        { error: 'Missing required fields: email, portalId' },
        { status: 400 }
      );
    }

    // Get or create workspace
    const workspace = getOrCreateWorkspace(portalId, name);

    // Check if already premium
    if (action === 'checkout' && isPremiumByPortalId(portalId)) {
      return NextResponse.json(
        { error: 'Already subscribed to premium', alreadyPremium: true },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let customer = await getCustomerByEmail(email);
    if (!customer) {
      customer = await createCustomer(email, portalId, name);
    }

    // Store subscription record in our DB
    getOrCreateSubscription(workspace.id, customer.id);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hubspot-health.figmints.net';

    // Handle billing portal access
    if (action === 'manage') {
      const existingSub = getSubscriptionByWorkspace(workspace.id);
      if (!existingSub || existingSub.status !== 'active') {
        return NextResponse.json(
          { error: 'No active subscription to manage' },
          { status: 400 }
        );
      }

      const portalSession = await createBillingPortalSession(
        customer.id,
        `${baseUrl}/dashboard`
      );

      return NextResponse.json({ url: portalSession.url });
    }

    // Create checkout session
    const session = await createCheckoutSession(
      customer.id,
      portalId,
      `${baseUrl}/dashboard?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      `${baseUrl}/results?canceled=true`,
      true // Include trial
    );

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/checkout
 * Check subscription status
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const portalId = searchParams.get('portalId');
    const email = searchParams.get('email');

    if (!portalId) {
      return NextResponse.json(
        { error: 'Missing portalId parameter' },
        { status: 400 }
      );
    }

    const isPremium = isPremiumByPortalId(portalId);
    
    // Get more details if email provided
    let subscription = null;
    if (email) {
      const customer = await getCustomerByEmail(email);
      if (customer) {
        subscription = await getCustomerActiveSubscription(customer.id);
      }
    }

    // Cast to any for Stripe Subscription properties
    const sub = subscription as any;
    return NextResponse.json({
      isPremium,
      subscription: subscription ? {
        status: sub.status,
        currentPeriodEnd: sub.current_period_end 
          ? new Date(sub.current_period_end * 1000).toISOString() 
          : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      } : null,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check status', message: String(error) },
      { status: 500 }
    );
  }
}
