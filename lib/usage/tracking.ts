import { createClient } from '@/lib/supabase/server'

/**
 * Get current month string in YYYY-MM format
 */
export function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Get or create usage tracking for current month
 */
export async function getOrCreateUsageTracking(userId: string) {
  const supabase = await createClient()
  const currentMonth = getCurrentMonth()

  // Try to get existing usage
  const { data: existing, error: fetchError } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('month', currentMonth)
    .single()

  if (existing) {
    return { data: existing, error: null }
  }

  // Create new usage tracking for this month
  const { data: created, error: createError } = await supabase
    .from('usage_tracking')
    .insert({
      user_id: userId,
      month: currentMonth,
      tomes_generated: 0,
      tokens_used: 0,
      covers_generated: 0,
    })
    .select()
    .single()

  return { data: created, error: createError }
}

/**
 * Increment tome generation count
 */
export async function incrementTomeCount(userId: string, tokensUsed: number = 0) {
  const supabase = await createClient()
  const currentMonth = getCurrentMonth()

  const { data, error } = await supabase.rpc('increment_usage', {
    p_user_id: userId,
    p_month: currentMonth,
    p_tomes: 1,
    p_tokens: tokensUsed,
    p_covers: 1,
  })

  return { data, error }
}

/**
 * Check if user has remaining tomes for current month
 */
export async function checkUsageLimit(userId: string, subscriptionTier: string) {
  const { data: usage } = await getOrCreateUsageTracking(userId)

  if (!usage) {
    return { allowed: false, remaining: 0, limit: 0 }
  }

  // Import here to avoid circular dependency
  const { SUBSCRIPTION_LIMITS } = await import('./plans')
  const tierKey = subscriptionTier as keyof typeof SUBSCRIPTION_LIMITS
  const limit = SUBSCRIPTION_LIMITS[tierKey]?.tomes_per_month || 1

  const remaining = Math.max(0, limit - usage.tomes_generated)
  const allowed = remaining > 0

  return {
    allowed,
    remaining,
    limit,
    used: usage.tomes_generated,
  }
}
