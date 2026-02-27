/**
 * Stripe Integration for HubSpot Health Checker
 * Handles payments, subscriptions, and customer management
 */

import Stripe from 'stripe';

// Lazy-initialize Stripe (to avoid build-time errors)
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (_stripe) return _stripe;
  
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  
  _stripe = new Stripe(secretKey);
  return _stripe;
}

// Product/Price configuration
export const STRIPE_CONFIG = {
  productName: 'HubSpot Health Premium',
  priceAmount: 9900, // $99.00 in cents
  currency: 'usd',
  interval: 'month' as const,
  trialDays: 14,
};

/**
 * Get or create the Premium product and price
 */
export async function getOrCreatePrice(): Promise<string> {
  const stripe = getStripe();
  
  // Check if we have a cached price ID in env
  if (process.env.STRIPE_PRICE_ID) {
    return process.env.STRIPE_PRICE_ID;
  }

  // Look for existing product
  const products = await stripe.products.list({
    active: true,
    limit: 100,
  });

  let product = products.data.find(p => p.name === STRIPE_CONFIG.productName);

  if (!product) {
    // Create the product
    product = await stripe.products.create({
      name: STRIPE_CONFIG.productName,
      description: 'Premium HubSpot health monitoring with automated fixes, daily monitoring, and PDF reports.',
      metadata: {
        app: 'hubspot-health-checker',
      },
    });
  }

  // Look for existing price
  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 100,
  });

  let price = prices.data.find(
    p => p.unit_amount === STRIPE_CONFIG.priceAmount && 
         p.recurring?.interval === STRIPE_CONFIG.interval
  );

  if (!price) {
    // Create the price
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: STRIPE_CONFIG.priceAmount,
      currency: STRIPE_CONFIG.currency,
      recurring: {
        interval: STRIPE_CONFIG.interval,
      },
      metadata: {
        app: 'hubspot-health-checker',
      },
    });
  }

  return price.id;
}

/**
 * Create a Stripe customer
 */
export async function createCustomer(
  email: string,
  portalId: string,
  name?: string
): Promise<Stripe.Customer> {
  const stripe = getStripe();
  
  // Check if customer already exists
  const existing = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existing.data.length > 0) {
    const customer = existing.data[0];
    // Update metadata if needed
    if (customer.metadata.portalId !== portalId) {
      return await stripe.customers.update(customer.id, {
        metadata: { portalId },
      });
    }
    return customer;
  }

  return await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      portalId,
      app: 'hubspot-health-checker',
    },
  });
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(
  customerId: string,
  portalId: string,
  successUrl: string,
  cancelUrl: string,
  withTrial: boolean = true
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const priceId = await getOrCreatePrice();

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      portalId,
      app: 'hubspot-health-checker',
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  };

  // Add trial if requested
  if (withTrial) {
    sessionParams.subscription_data = {
      trial_period_days: STRIPE_CONFIG.trialDays,
      metadata: {
        portalId,
      },
    };
  }

  return await stripe.checkout.sessions.create(sessionParams);
}

/**
 * Create a billing portal session for managing subscription
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripe();
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Get subscription status
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    return null;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelStripeSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  if (immediately) {
    return await stripe.subscriptions.cancel(subscriptionId);
  }
  
  // Cancel at period end
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Reactivate a subscription that was set to cancel
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  const stripe = getStripe();
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Construct and verify a webhook event
 */
export function constructWebhookEvent(
  payload: Buffer | string,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');
  }
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Get customer by email
 */
export async function getCustomerByEmail(email: string): Promise<Stripe.Customer | null> {
  const stripe = getStripe();
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });
  
  return customers.data[0] || null;
}

/**
 * Get customer's active subscription
 */
export async function getCustomerActiveSubscription(
  customerId: string
): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  });

  if (subscriptions.data.length > 0) {
    return subscriptions.data[0];
  }

  // Also check for trialing
  const trialingSubs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'trialing',
    limit: 1,
  });

  return trialingSubs.data[0] || null;
}

// Export the getStripe function for direct access if needed
export { getStripe };
