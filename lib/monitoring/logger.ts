import { createClient } from '@supabase/supabase-js'

// Use service role key for logging (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface GenerationLogData {
  userId: string
  jobId?: string
  tomeId?: string
  modelUsed: string
  tokensUsed?: number
  costUsd?: number
  durationMs?: number
  success: boolean
  errorMessage?: string
}

/**
 * Log a generation attempt for monitoring
 */
export async function logGeneration(data: GenerationLogData) {
  try {
    const { error } = await supabaseAdmin.from('generation_logs').insert({
      user_id: data.userId,
      job_id: data.jobId,
      tome_id: data.tomeId,
      model_used: data.modelUsed,
      tokens_used: data.tokensUsed || 0,
      cost_usd: data.costUsd || 0,
      duration_ms: data.durationMs || 0,
      success: data.success,
      error_message: data.errorMessage,
    })

    if (error) {
      console.error('Failed to log generation:', error)
    }
  } catch (err) {
    console.error('Failed to log generation:', err)
  }
}

/**
 * Estimate cost based on model and tokens
 */
export function estimateCost(model: string, tokensUsed: number): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 0.0025, output: 0.01 }, // per 1k tokens
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
    'dall-e-3': { input: 0.04, output: 0.04 }, // per image
    'dall-e-2': { input: 0.02, output: 0.02 }, // per image
  }

  const modelPricing = pricing[model]
  if (!modelPricing) {
    return 0
  }

  // Rough estimate: assume 30% input, 70% output
  const inputTokens = tokensUsed * 0.3
  const outputTokens = tokensUsed * 0.7

  const cost =
    (inputTokens / 1000) * modelPricing.input +
    (outputTokens / 1000) * modelPricing.output

  return cost
}

/**
 * Track generation progress
 */
export async function updateJobProgress(
  jobId: string,
  progress: number,
  currentStep: string
) {
  try {
    const { error } = await supabaseAdmin
      .from('generation_jobs')
      .update({
        progress,
        current_step: currentStep,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    if (error) {
      console.error('Failed to update job progress:', error)
    }
  } catch (err) {
    console.error('Failed to update job progress:', err)
  }
}

/**
 * Mark job as completed
 */
export async function completeJob(jobId: string, tomeId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('generation_jobs')
      .update({
        status: 'completed',
        tome_id: tomeId,
        progress: 100,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    if (error) {
      console.error('Failed to complete job:', error)
    }
  } catch (err) {
    console.error('Failed to complete job:', err)
  }
}

/**
 * Mark job as failed
 */
export async function failJob(jobId: string, errorMessage: string) {
  try {
    const { error } = await supabaseAdmin
      .from('generation_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    if (error) {
      console.error('Failed to mark job as failed:', error)
    }
  } catch (err) {
    console.error('Failed to mark job as failed:', err)
  }
}
