import { createClient } from '@/lib/supabase/server'

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: Date
}

/**
 * Check if user is rate limited (max 5 generations per hour)
 */
export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  const supabase = await createClient()

  const oneHourAgo = new Date(Date.now() - 3600000)

  const { count, error } = await supabase
    .from('generation_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneHourAgo.toISOString())

  if (error) {
    console.error('Rate limit check error:', error)
    // Fail open - allow the request if we can't check
    return {
      allowed: true,
      limit: 5,
      remaining: 5,
      resetAt: new Date(Date.now() + 3600000),
    }
  }

  const limit = 5
  const used = count || 0
  const remaining = Math.max(0, limit - used)
  const resetAt = new Date(Date.now() + 3600000)

  return {
    allowed: remaining > 0,
    limit,
    remaining,
    resetAt,
  }
}

/**
 * Check if user can generate based on both subscription limits and rate limits
 */
export async function canUserGenerate(
  userId: string,
  subscriptionTier: string
): Promise<{ allowed: boolean; reason?: string; resetAt?: Date }> {
  // Check rate limit first (protects against abuse)
  const rateLimit = await checkRateLimit(userId)

  if (!rateLimit.allowed) {
    return {
      allowed: false,
      reason: `Limite horaire atteinte (${rateLimit.limit} générations/heure). Réessayez dans ${Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 60000)} minutes.`,
      resetAt: rateLimit.resetAt,
    }
  }

  // Check monthly subscription limit
  const { checkUsageLimit } = await import('@/lib/usage/tracking')
  const usageCheck = await checkUsageLimit(userId, subscriptionTier)

  if (!usageCheck.allowed) {
    return {
      allowed: false,
      reason: `Limite mensuelle atteinte (${usageCheck.limit} tomes/mois). Passez à un plan supérieur pour continuer.`,
    }
  }

  return { allowed: true }
}
