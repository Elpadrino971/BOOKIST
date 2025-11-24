import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Get job status (for polling)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Get job status
    const { data: job, error } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (error || !job) {
      return NextResponse.json({ error: 'Job non trouvé' }, { status: 404 })
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      currentStep: job.current_step,
      tomeId: job.tome_id,
      errorMessage: job.error_message,
      createdAt: job.created_at,
      completedAt: job.completed_at,
    })
  } catch (error) {
    console.error('Error fetching job status:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
