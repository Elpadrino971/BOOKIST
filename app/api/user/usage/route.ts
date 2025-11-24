import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateUsageTracking } from '@/lib/usage/tracking'
import { checkUsageLimit } from '@/lib/usage/tracking'

export async function GET(request: NextRequest) {
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

    // Get profile for subscription tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    const subscriptionTier = profile?.subscription_tier || 'free'

    // Get current usage
    const { data: usage } = await getOrCreateUsageTracking(user.id)

    // Check limits
    const limits = await checkUsageLimit(user.id, subscriptionTier)

    return NextResponse.json({
      usage,
      limits,
      subscriptionTier,
    })
  } catch (error) {
    console.error('Error fetching usage:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
