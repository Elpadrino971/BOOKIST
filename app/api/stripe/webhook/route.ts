import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Use service role key for webhook (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const planId = session.metadata?.plan_id

        if (userId && planId) {
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_tier: planId,
              subscription_status: 'active',
              stripe_customer_id: session.customer as string,
            })
            .eq('id', userId)

          console.log(`Subscription activated for user ${userId}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.user_id

        if (userId) {
          const status = subscription.status === 'active' ? 'active' : 'past_due'

          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: status,
            })
            .eq('id', userId)

          console.log(`Subscription updated for user ${userId}: ${status}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.user_id

        if (userId) {
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_tier: 'free',
              subscription_status: 'canceled',
            })
            .eq('id', userId)

          console.log(`Subscription canceled for user ${userId}`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error handling webhook:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
