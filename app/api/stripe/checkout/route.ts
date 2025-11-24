import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, getOrCreateCustomer } from '@/lib/stripe/client'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription/plans'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const planId = formData.get('plan') as string

    // Find plan
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)
    if (!plan || !plan.stripe_price_id) {
      return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
    }

    // Get or create profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get or create Stripe customer
    const customer = await getOrCreateCustomer(user.id, user.email!)

    // Update profile with customer ID if needed
    if (!profile?.stripe_customer_id) {
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('id', user.id)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      client_reference_id: user.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_id: planId,
        },
      },
    })

    // Redirect to checkout
    return NextResponse.redirect(session.url!)
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
