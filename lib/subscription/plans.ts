// Subscription tiers and their limits
export const SUBSCRIPTION_LIMITS = {
  free: {
    tomes_per_month: 1,
    has_covers: false,
    text_model: 'gpt-4o-mini',
    cover_model: null,
    estimated_cost_per_tome: 0.08,
  },
  starter: {
    tomes_per_month: 3,
    has_covers: true,
    text_model: 'claude-3-haiku-20240307',
    cover_model: 'dall-e-2',
    estimated_cost_per_tome: 0.15,
  },
  basic: {
    tomes_per_month: 8,
    has_covers: true,
    text_model: 'claude-3-haiku-20240307',
    cover_model: 'dall-e-3',
    estimated_cost_per_tome: 0.20,
  },
  pro: {
    tomes_per_month: 20, // Fair-use limit
    has_covers: true,
    text_model: 'gpt-4o',
    cover_model: 'dall-e-3',
    estimated_cost_per_tome: 0.65,
  },
} as const

export type SubscriptionTier = keyof typeof SUBSCRIPTION_LIMITS

export interface ModelConfig {
  textModel: string
  coverModel: string | null
  hasCover: boolean
  estimatedCost: number
}

/**
 * Select the appropriate AI models based on subscription tier
 */
export function selectModels(tier: SubscriptionTier): ModelConfig {
  const config = SUBSCRIPTION_LIMITS[tier]

  return {
    textModel: config.text_model,
    coverModel: config.cover_model,
    hasCover: config.has_covers,
    estimatedCost: config.estimated_cost_per_tome,
  }
}

/**
 * Check if user can generate a tome based on their subscription and usage
 */
export function canGenerateTome(
  tier: SubscriptionTier,
  tomesGeneratedThisMonth: number
): { allowed: boolean; reason?: string } {
  const limit = SUBSCRIPTION_LIMITS[tier].tomes_per_month

  if (tomesGeneratedThisMonth >= limit) {
    return {
      allowed: false,
      reason: `Limite mensuelle atteinte (${limit} tome${limit > 1 ? 's' : ''}/mois). Passez à un plan supérieur pour continuer.`,
    }
  }

  return { allowed: true }
}

/**
 * Get subscription tier display info
 */
export const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      '1 tome par mois',
      'Génération avec GPT-4o-mini',
      'Sans couverture IA',
      'Export PDF basique',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 4.99,
    popular: false,
    features: [
      '3 tomes par mois',
      'Génération avec Claude Haiku',
      'Couvertures IA (DALL-E 2)',
      'Export PDF et EPUB',
    ],
    stripe_price_id: process.env.STRIPE_STARTER_PRICE_ID,
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    popular: true,
    features: [
      '8 tomes par mois',
      'Génération avec Claude Haiku',
      'Couvertures HD (DALL-E 3)',
      'Export PDF et EPUB',
      'Priorité de génération',
    ],
    stripe_price_id: process.env.STRIPE_BASIC_PRICE_ID,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    popular: false,
    features: [
      '20 tomes par mois',
      'Génération premium (GPT-4o)',
      'Couvertures HD (DALL-E 3)',
      'Export PDF et EPUB',
      'Génération prioritaire',
      'Accès anticipé aux nouvelles features',
    ],
    stripe_price_id: process.env.STRIPE_PRO_PRICE_ID,
  },
] as const
