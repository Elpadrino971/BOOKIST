import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canUserGenerate } from '@/lib/utils/rate-limit'

/**
 * Create a generation job (non-blocking)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: novelId } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    const subscriptionTier = profile?.subscription_tier || 'free'

    // Check if user can generate (rate limit + subscription limit)
    const canGenerate = await canUserGenerate(user.id, subscriptionTier)

    if (!canGenerate.allowed) {
      return NextResponse.json(
        {
          error: canGenerate.reason,
          resetAt: canGenerate.resetAt,
        },
        { status: 429 }
      )
    }

    // Verify novel ownership
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('id, total_tomes')
      .eq('id', novelId)
      .eq('user_id', user.id)
      .single()

    if (novelError || !novel) {
      return NextResponse.json({ error: 'Roman non trouvé' }, { status: 404 })
    }

    const nextTomeNumber = novel.total_tomes + 1

    // Check if a job already exists for this tome
    const { data: existingJob } = await supabase
      .from('generation_jobs')
      .select('id, status')
      .eq('novel_id', novelId)
      .eq('tome_number', nextTomeNumber)
      .in('status', ['pending', 'processing'])
      .single()

    if (existingJob) {
      return NextResponse.json({
        jobId: existingJob.id,
        status: existingJob.status,
        message: 'Un tome est déjà en cours de génération',
      })
    }

    // Create generation job
    const { data: job, error: jobError } = await supabase
      .from('generation_jobs')
      .insert({
        user_id: user.id,
        novel_id: novelId,
        tome_number: nextTomeNumber,
        status: 'pending',
        progress: 0,
      })
      .select()
      .single()

    if (jobError || !job) {
      console.error('Error creating job:', jobError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du job' },
        { status: 500 }
      )
    }

    // Trigger the worker (in production, this would be a separate service)
    // For now, we'll use a simple setTimeout to process in background
    if (process.env.NODE_ENV === 'production') {
      // In production, trigger worker via API call or queue
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/worker/process-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      }).catch((err) => console.error('Failed to trigger worker:', err))
    }

    return NextResponse.json({
      jobId: job.id,
      status: 'pending',
      message: 'Génération lancée ! Vous serez notifié quand le tome sera prêt.',
      tomeNumber: nextTomeNumber,
    })
  } catch (error) {
    console.error('Error creating generation job:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
