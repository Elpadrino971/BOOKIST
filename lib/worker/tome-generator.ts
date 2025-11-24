import { createClient } from '@supabase/supabase-js'
import { generateChapter } from '@/lib/ai/openai'
import { generateChapterClaude, generateRecapForNextTome } from '@/lib/ai/anthropic'
import {
  generateCoverImage,
  generateTomeSummary,
  analyzeCharacterEvolution,
  extractOpenArcs,
} from '@/lib/ai/openai'
import { selectModels } from '@/lib/subscription/plans'
import { withRetryAndTimeout } from '@/lib/utils/retry'
import {
  logGeneration,
  estimateCost,
  updateJobProgress,
  completeJob,
  failJob,
} from '@/lib/monitoring/logger'

// Use service role for background processing
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface GenerationContext {
  jobId: string
  userId: string
  novelId: string
  tomeNumber: number
}

export async function processTomeGeneration(context: GenerationContext) {
  const startTime = Date.now()
  const { jobId, userId, novelId, tomeNumber } = context

  try {
    // Get novel details
    const { data: novel, error: novelError } = await supabaseAdmin
      .from('novels')
      .select('*')
      .eq('id', novelId)
      .single()

    if (novelError || !novel) {
      throw new Error('Novel not found')
    }

    // Get user profile for subscription tier
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    const subscriptionTier = profile?.subscription_tier || 'free'
    const models = selectModels(subscriptionTier as any)

    await updateJobProgress(jobId, 5, 'Initializing')

    // Get previous tomes for context
    const { data: previousTomes } = await supabaseAdmin
      .from('tomes')
      .select('*')
      .eq('novel_id', novelId)
      .order('tome_number', { ascending: true })

    // Create tome entry
    const { data: tome, error: tomeError } = await supabaseAdmin
      .from('tomes')
      .insert({
        novel_id: novelId,
        tome_number: tomeNumber,
        title: `Tome ${tomeNumber}`,
        status: 'draft',
        word_count: 0,
      })
      .select()
      .single()

    if (tomeError || !tome) {
      throw new Error('Failed to create tome')
    }

    await updateJobProgress(jobId, 10, 'Generating context')

    // Generate recap if not first tome
    let recap = ''
    if (previousTomes && previousTomes.length > 0) {
      recap = await withRetryAndTimeout(
        () =>
          generateRecapForNextTome({
            previousTomes: previousTomes.map((t) => ({
              tomeNumber: t.tome_number,
              summary: t.summary || '',
              cliffhanger: t.cliffhanger,
              characterEvolution: t.character_evolution as Record<string, string>,
              openArcs: t.open_arcs as string[],
            })),
            nextTomeNumber: tomeNumber,
          }),
        { maxRetries: 2, timeout: 30000 }
      )

      await logGeneration({
        userId,
        jobId,
        tomeId: tome.id,
        modelUsed: 'claude-3-5-sonnet-20241022',
        tokensUsed: 500,
        costUsd: estimateCost('claude-3-5-sonnet-20241022', 500),
        durationMs: Date.now() - startTime,
        success: true,
      })
    }

    // Generate 3 chapters
    const chapters = []
    const chapterTitles = ['Chapitre 1', 'Chapitre 2', 'Chapitre 3']

    for (let i = 0; i < 3; i++) {
      const chapterNumber = i + 1
      await updateJobProgress(jobId, 20 + i * 20, `Generating chapter ${chapterNumber}`)

      const chapterStartTime = Date.now()

      let chapterContent = ''

      // Generate with retry
      if (models.textModel.includes('claude')) {
        chapterContent = await withRetryAndTimeout(
          () =>
            generateChapterClaude({
              title: chapterTitles[i],
              chapterNumber,
              genre: novel.genre,
              heroName: novel.hero_name,
              theme: novel.theme,
              writingStyle: novel.writing_style,
              maturityLevel: novel.maturity_level,
              previousContext: i === 0 ? recap : chapters[i - 1]?.content || '',
              targetWordCount: 2000,
            }),
          { maxRetries: 3, timeout: 90000 }
        )
      } else {
        chapterContent = await withRetryAndTimeout(
          () =>
            generateChapter({
              title: chapterTitles[i],
              chapterNumber,
              genre: novel.genre,
              heroName: novel.hero_name,
              theme: novel.theme,
              writingStyle: novel.writing_style,
              maturityLevel: novel.maturity_level,
              previousContext: i === 0 ? recap : chapters[i - 1]?.content || '',
              targetWordCount: 2000,
            }),
          { maxRetries: 3, timeout: 90000 }
        )
      }

      const wordCount = chapterContent.split(/\s+/).length
      const tokensUsed = Math.ceil(wordCount * 1.3) // Rough estimate

      // Save chapter immediately
      const { data: chapter, error: chapterError } = await supabaseAdmin
        .from('chapters')
        .insert({
          tome_id: tome.id,
          chapter_number: chapterNumber,
          title: chapterTitles[i],
          content: chapterContent,
          word_count: wordCount,
        })
        .select()
        .single()

      if (chapterError) {
        throw new Error(`Failed to save chapter ${chapterNumber}`)
      }

      chapters.push(chapter)

      // Log chapter generation
      await logGeneration({
        userId,
        jobId,
        tomeId: tome.id,
        modelUsed: models.textModel,
        tokensUsed,
        costUsd: estimateCost(models.textModel, tokensUsed),
        durationMs: Date.now() - chapterStartTime,
        success: true,
      })
    }

    await updateJobProgress(jobId, 70, 'Generating metadata')

    // Generate summary
    const summary = await withRetryAndTimeout(
      () =>
        generateTomeSummary({
          chapters: chapters.map((ch) => ({ title: ch.title, content: ch.content })),
          heroName: novel.hero_name,
        }),
      { maxRetries: 2, timeout: 30000 }
    )

    // Analyze character evolution
    const characterEvolution = await withRetryAndTimeout(
      () =>
        analyzeCharacterEvolution({
          chapters: chapters.map((ch) => ({ title: ch.title, content: ch.content })),
          heroName: novel.hero_name,
          secondaryCharacters: novel.secondary_characters as string[],
        }),
      { maxRetries: 2, timeout: 30000 }
    )

    // Extract open arcs
    const openArcs = await withRetryAndTimeout(
      () => extractOpenArcs(chapters.map((ch) => ({ content: ch.content }))),
      { maxRetries: 2, timeout: 30000 }
    )

    // Extract cliffhanger
    const lastChapter = chapters[chapters.length - 1]
    const cliffhanger = lastChapter?.content.split('\n').slice(-3).join('\n') || null

    await updateJobProgress(jobId, 85, 'Generating cover')

    // Generate cover if allowed
    let coverUrl = null
    if (models.hasCover) {
      try {
        coverUrl = await withRetryAndTimeout(
          () =>
            generateCoverImage({
              title: novel.title,
              genre: novel.genre,
              heroName: novel.hero_name,
              coverStyle: novel.cover_style,
              tomeNumber,
            }),
          { maxRetries: 2, timeout: 60000 }
        )

        await logGeneration({
          userId,
          jobId,
          tomeId: tome.id,
          modelUsed: models.coverModel || 'dall-e-3',
          tokensUsed: 1,
          costUsd: models.coverModel === 'dall-e-2' ? 0.02 : 0.04,
          durationMs: 5000,
          success: true,
        })
      } catch (error) {
        console.error('Cover generation failed:', error)
        // Continue without cover
      }
    }

    await updateJobProgress(jobId, 95, 'Finalizing')

    // Calculate total word count
    const totalWordCount = chapters.reduce((sum, ch) => sum + ch.word_count, 0)

    // Update tome
    const { data: updatedTome, error: updateError } = await supabaseAdmin
      .from('tomes')
      .update({
        summary,
        word_count: totalWordCount,
        cover_image_url: coverUrl,
        cliffhanger,
        character_evolution: characterEvolution,
        open_arcs: openArcs,
        status: 'completed',
      })
      .eq('id', tome.id)
      .select()
      .single()

    if (updateError) {
      throw new Error('Failed to update tome')
    }

    // Mark job as completed
    await completeJob(jobId, tome.id)

    // Track usage (increment tome count)
    await supabaseAdmin.rpc('increment_usage', {
      p_user_id: userId,
      p_month: new Date().toISOString().slice(0, 7),
      p_tomes: 1,
      p_tokens: 0,
      p_covers: models.hasCover ? 1 : 0,
    })

    const totalDuration = Date.now() - startTime

    console.log(
      `✅ Tome ${tomeNumber} generated successfully in ${totalDuration}ms (${Math.round(totalDuration / 1000)}s)`
    )

    return { success: true, tomeId: tome.id }
  } catch (error: any) {
    console.error('Error generating tome:', error)

    // Mark job as failed
    await failJob(jobId, error.message || 'Unknown error')

    // Log failure
    await logGeneration({
      userId,
      jobId,
      modelUsed: 'unknown',
      tokensUsed: 0,
      costUsd: 0,
      durationMs: Date.now() - startTime,
      success: false,
      errorMessage: error.message,
    })

    return { success: false, error: error.message }
  }
}
