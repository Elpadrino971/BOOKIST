import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Fetch tome with chapters
    const { data: tome, error: fetchError } = await supabase
      .from('tomes')
      .select(`
        *,
        chapters (
          id,
          chapter_number,
          title,
          content,
          word_count
        ),
        novels!inner (
          id,
          user_id,
          title,
          genre,
          hero_name
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !tome) {
      return NextResponse.json({ error: 'Tome non trouvé' }, { status: 404 })
    }

    // Check ownership
    if (tome.novels.user_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Sort chapters by chapter_number
    if (tome.chapters) {
      tome.chapters.sort((a: any, b: any) => a.chapter_number - b.chapter_number)
    }

    return NextResponse.json({ tome })
  } catch (error) {
    console.error('Error fetching tome:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
