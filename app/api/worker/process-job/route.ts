import { NextRequest, NextResponse } from 'next/server'
import { processTomeGeneration } from '@/lib/worker/tome-generator'
import { createClient } from '@supabase/supabase-js'

// Use service role for worker
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Worker endpoint to process generation jobs
 * In production, this should be protected with a secret token
 */
export async function POST(request: NextRequest) {
  try {
    // Verify worker secret (in production)
    const authHeader = request.headers.get('authorization')
    const workerSecret = process.env.WORKER_SECRET

    if (workerSecret && authHeader !== `Bearer ${workerSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { jobId } = body

    if (!jobId) {
      // If no jobId provided, get next pending job
      const { data: pendingJobs } = await supabaseAdmin
        .from('generation_jobs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)

      if (!pendingJobs || pendingJobs.length === 0) {
        return NextResponse.json({ message: 'No pending jobs' })
      }

      const job = pendingJobs[0]

      // Process in background (don't wait)
      processTomeGeneration({
        jobId: job.id,
        userId: job.user_id,
        novelId: job.novel_id,
        tomeNumber: job.tome_number,
      }).catch((error) => {
        console.error('Background job failed:', error)
      })

      return NextResponse.json({
        message: 'Job processing started',
        jobId: job.id,
      })
    }

    // Get specific job
    const { data: job } = await supabaseAdmin
      .from('generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Process in background
    processTomeGeneration({
      jobId: job.id,
      userId: job.user_id,
      novelId: job.novel_id,
      tomeNumber: job.tome_number,
    }).catch((error) => {
      console.error('Background job failed:', error)
    })

    return NextResponse.json({
      message: 'Job processing started',
      jobId: job.id,
    })
  } catch (error) {
    console.error('Worker error:', error)
    return NextResponse.json({ error: 'Worker error' }, { status: 500 })
  }
}

/**
 * GET endpoint to manually trigger worker (dev only)
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  // Get next pending job
  const { data: pendingJobs } = await supabaseAdmin
    .from('generation_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1)

  if (!pendingJobs || pendingJobs.length === 0) {
    return NextResponse.json({ message: 'No pending jobs' })
  }

  const job = pendingJobs[0]

  // Process synchronously for testing
  const result = await processTomeGeneration({
    jobId: job.id,
    userId: job.user_id,
    novelId: job.novel_id,
    tomeNumber: job.tome_number,
  })

  return NextResponse.json(result)
}
