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

    // Fetch novel with tomes
    const { data: novel, error: fetchError } = await supabase
      .from('novels')
      .select(`
        *,
        tomes (
          id,
          tome_number,
          title,
          summary,
          word_count,
          cover_image_url,
          status,
          created_at
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !novel) {
      return NextResponse.json({ error: 'Roman non trouvé' }, { status: 404 })
    }

    return NextResponse.json({ novel })
  } catch (error) {
    console.error('Error fetching novel:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
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

    // Delete novel (cascades to tomes and chapters)
    const { error: deleteError } = await supabase
      .from('novels')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting novel:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
