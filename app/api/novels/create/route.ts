import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateNovelPremise } from '@/lib/ai/anthropic'

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()
    const {
      title,
      genre,
      hero_name,
      secondary_characters,
      theme,
      writing_style,
      maturity_level,
      cover_style,
    } = body

    // Validate required fields
    if (!title || !genre || !hero_name || !theme || !writing_style || !maturity_level || !cover_style) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }

    // Generate premise for the novel
    const description = await generateNovelPremise({
      genre,
      theme,
      heroName: hero_name,
      secondaryCharacters: secondary_characters || [],
      writingStyle: writing_style,
      maturityLevel: maturity_level,
    })

    // Create novel in database
    const { data: novel, error: createError } = await supabase
      .from('novels')
      .insert({
        user_id: user.id,
        title,
        description,
        genre,
        hero_name,
        secondary_characters: secondary_characters || [],
        theme,
        writing_style,
        maturity_level,
        cover_style,
        total_tomes: 0,
        status: 'active',
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating novel:', createError)
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
    }

    return NextResponse.json({ novel }, { status: 201 })
  } catch (error) {
    console.error('Error in create novel:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
