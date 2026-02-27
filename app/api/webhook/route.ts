import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { constructWebhookEvent } from '@/lib/stripe';
import {
  setStripeSubscriptionId,
  updateSubscriptionStatus,
  cancelSubscription,
  getSubscriptionByCustomerId,
  createAlert,
} from '@/lib/db';

/**
 * POST /api/webhook
 * Handles Stripe webhook events
 */
export async function POST(request: Request) {
  const body = await request.text();
  const headersList = headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('Missing stripe-signature header');
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[Stripe] Checkout completed for customer: ${session.customer}`);
        
        // The subscription ID will be set when we receive the subscription.created event
        // But we can log the session completion
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as any; // Stripe.Subscription
        const customerId = subscription.customer as string;
        
        console.log(`[Stripe] Subscription created: ${subscription.id} for customer: ${customerId}`);
        
        // Update our database
        setStripeSubscriptionId(
          customerId,
          subscription.id,
          subscription.status === 'active' || subscription.status === 'trialing' ? subscription.status : 'inactive',
          subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined
        );

        // Create alert for the workspace
        const dbSub = getSubscriptionByCustomerId(customerId);
        if (dbSub) {
          createAlert(
            dbSub.workspace_id,
            'subscription_created',
            '🎉 Premium Activated!',
            subscription.status === 'trialing' 
              ? 'Your 14-day free trial has started. Enjoy all premium features!'
              : 'Your premium subscription is now active. Enjoy all premium features!',
            'info'
          );
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any; // Stripe.Subscription
        
        console.log(`[Stripe] Subscription updated: ${subscription.id}, status: ${subscription.status}`);
        
        let status: 'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing';
        switch (subscription.status) {
          case 'active':
          case 'trialing':
          case 'past_due':
          case 'canceled':
            status = subscription.status;
            break;
          default:
            status = 'inactive';
        }
        
        updateSubscriptionStatus(
          subscription.id,
          status,
          subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
          subscription.cancel_at_period_end
        );

        // Alert if subscription is past due
        if (subscription.status === 'past_due') {
          const dbSub = getSubscriptionByCustomerId(subscription.customer as string);
          if (dbSub) {
            createAlert(
              dbSub.workspace_id,
              'payment_past_due',
              '⚠️ Payment Past Due',
              'Your payment failed. Please update your payment method to continue using premium features.',
              'warning'
            );
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any; // Stripe.Subscription
        
        console.log(`[Stripe] Subscription canceled: ${subscription.id}`);
        
        cancelSubscription(subscription.id);

        // Create alert
        const dbSub = getSubscriptionByCustomerId(subscription.customer as string);
        if (dbSub) {
          createAlert(
            dbSub.workspace_id,
            'subscription_canceled',
            '📋 Subscription Ended',
            'Your premium subscription has ended. You can still use the free audit features.',
            'info'
          );
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any; // Stripe.Invoice
        const customerId = invoice.customer as string;
        
        console.log(`[Stripe] Payment failed for customer: ${customerId}`);
        
        const dbSub = getSubscriptionByCustomerId(customerId);
        if (dbSub) {
          createAlert(
            dbSub.workspace_id,
            'payment_failed',
            '❌ Payment Failed',
            'We couldn\'t process your payment. Please update your payment method to avoid service interruption.',
            'critical'
          );
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any; // Stripe.Invoice
        const customerId = invoice.customer as string;
        
        console.log(`[Stripe] Payment succeeded for customer: ${customerId}`);
        
        // If this is a renewal, update the period end
        if (invoice.subscription) {
          const subscriptionId = typeof invoice.subscription === 'string' 
            ? invoice.subscription 
            : invoice.subscription.id;
            
          updateSubscriptionStatus(
            subscriptionId,
            'active',
            invoice.period_end ? new Date(invoice.period_end * 1000) : undefined
          );
        }
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as any; // Stripe.Subscription
        const customerId = subscription.customer as string;
        
        console.log(`[Stripe] Trial ending soon for customer: ${customerId}`);
        
        const dbSub = getSubscriptionByCustomerId(customerId);
        if (dbSub) {
          createAlert(
            dbSub.workspace_id,
            'trial_ending',
            '⏰ Trial Ending Soon',
            'Your free trial ends in 3 days. Add a payment method to continue using premium features.',
            'warning'
          );
        }
        break;
      }

      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', message: String(error) },
      { status: 500 }
    );
  }
}

// Note: In Next.js App Router, the body is not pre-parsed for POST requests
// so we can use request.text() directly for raw body access
