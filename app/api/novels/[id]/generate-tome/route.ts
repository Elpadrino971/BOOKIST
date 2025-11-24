import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkUsageLimit } from '@/lib/usage/tracking'
import { selectModels } from '@/lib/subscription/plans'
import { generateChapter } from '@/lib/ai/openai'
import { generateChapterClaude, generateRecapForNextTome } from '@/lib/ai/anthropic'
import { generateCoverImage, generateTomeSummary, analyzeCharacterEvolution, extractOpenArcs } from '@/lib/ai/openai'

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

    // Get user profile with subscription info
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    const subscriptionTier = profile?.subscription_tier || 'free'

    // Check usage limits
    const usageCheck = await checkUsageLimit(user.id, subscriptionTier)
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Limite mensuelle atteinte',
          limit: usageCheck.limit,
          used: usageCheck.used,
        },
        { status: 403 }
      )
    }

    // Get novel details
    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('*')
      .eq('id', novelId)
      .eq('user_id', user.id)
      .single()

    if (novelError || !novel) {
      return NextResponse.json({ error: 'Roman non trouvé' }, { status: 404 })
    }

    // Get previous tomes for context
    const { data: previousTomes } = await supabase
      .from('tomes')
      .select('*')
      .eq('novel_id', novelId)
      .order('tome_number', { ascending: true })

    const nextTomeNumber = (previousTomes?.length || 0) + 1

    // Select AI models based on subscription
    const models = selectModels(subscriptionTier as any)

    // Create tome entry with "generating" status
    const { data: tome, error: tomeError } = await supabase
      .from('tomes')
      .insert({
        novel_id: novelId,
        tome_number: nextTomeNumber,
        title: `Tome ${nextTomeNumber}`,
        status: 'draft',
        word_count: 0,
      })
      .select()
      .single()

    if (tomeError || !tome) {
      return NextResponse.json({ error: 'Erreur lors de la création du tome' }, { status: 500 })
    }

    // Generate recap if not first tome
    let recap = ''
    if (previousTomes && previousTomes.length > 0) {
      recap = await generateRecapForNextTome({
        previousTomes: previousTomes.map((t) => ({
          tomeNumber: t.tome_number,
          summary: t.summary || '',
          cliffhanger: t.cliffhanger,
          characterEvolution: t.character_evolution as Record<string, string>,
          openArcs: t.open_arcs as string[],
        })),
        nextTomeNumber,
      })
    }

    // Generate 3 chapters
    const chapters = []
    const chapterTitles = [`Chapitre 1`, `Chapitre 2`, `Chapitre 3`]

    for (let i = 0; i < 3; i++) {
      const chapterNumber = i + 1
      const isLastChapter = chapterNumber === 3

      let chapterContent = ''

      // Use appropriate model
      if (models.textModel.includes('claude')) {
        chapterContent = await generateChapterClaude({
          title: chapterTitles[i],
          chapterNumber,
          genre: novel.genre,
          heroName: novel.hero_name,
          theme: novel.theme,
          writingStyle: novel.writing_style,
          maturityLevel: novel.maturity_level,
          previousContext: i === 0 ? recap : chapters[i - 1]?.content || '',
          targetWordCount: 2000,
        })
      } else {
        chapterContent = await generateChapter({
          title: chapterTitles[i],
          chapterNumber,
          genre: novel.genre,
          heroName: novel.hero_name,
          theme: novel.theme,
          writingStyle: novel.writing_style,
          maturityLevel: novel.maturity_level,
          previousContext: i === 0 ? recap : chapters[i - 1]?.content || '',
          targetWordCount: 2000,
        })
      }

      const wordCount = chapterContent.split(/\s+/).length

      const { data: chapter, error: chapterError } = await supabase
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
        console.error('Error creating chapter:', chapterError)
        continue
      }

      chapters.push(chapter)
    }

    // Generate tome summary
    const summary = await generateTomeSummary({
      chapters: chapters.map((ch) => ({ title: ch.title, content: ch.content })),
      heroName: novel.hero_name,
    })

    // Analyze character evolution
    const characterEvolution = await analyzeCharacterEvolution({
      chapters: chapters.map((ch) => ({ title: ch.title, content: ch.content })),
      heroName: novel.hero_name,
      secondaryCharacters: novel.secondary_characters as string[],
    })

    // Extract open arcs
    const openArcs = await extractOpenArcs(chapters.map((ch) => ({ content: ch.content })))

    // Extract cliffhanger from last chapter
    const lastChapter = chapters[chapters.length - 1]
    const cliffhanger = lastChapter?.content.split('\n').slice(-3).join('\n') || null

    // Generate cover if allowed
    let coverUrl = null
    if (models.hasCover) {
      try {
        coverUrl = await generateCoverImage({
          title: novel.title,
          genre: novel.genre,
          heroName: novel.hero_name,
          coverStyle: novel.cover_style,
          tomeNumber: nextTomeNumber,
        })
      } catch (error) {
        console.error('Error generating cover:', error)
      }
    }

    // Calculate total word count
    const totalWordCount = chapters.reduce((sum, ch) => sum + ch.word_count, 0)

    // Update tome with generated content
    const { data: updatedTome, error: updateError } = await supabase
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
      console.error('Error updating tome:', updateError)
    }

    // Track usage
    // Note: incrementTomeCount would need to be called here
    // For now, we'll skip it as it requires the RPC function to be set up in Supabase

    return NextResponse.json({
      tome: updatedTome,
      chapters,
      message: 'Tome généré avec succès',
    })
  } catch (error) {
    console.error('Error generating tome:', error)
    return NextResponse.json({ error: 'Erreur lors de la génération' }, { status: 500 })
  }
}
