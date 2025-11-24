import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Download } from 'lucide-react'

export default async function TomeReaderPage({
  params,
}: {
  params: Promise<{ id: string; number: string }>
}) {
  const { id: novelId, number } = await params
  const tomeNumber = parseInt(number, 10)

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch novel
  const { data: novel } = await supabase
    .from('novels')
    .select('*')
    .eq('id', novelId)
    .eq('user_id', user.id)
    .single()

  if (!novel) {
    redirect('/dashboard')
  }

  // Fetch tome with chapters
  const { data: tome, error } = await supabase
    .from('tomes')
    .select(`
      *,
      chapters (
        id,
        chapter_number,
        title,
        content,
        word_count
      )
    `)
    .eq('novel_id', novelId)
    .eq('tome_number', tomeNumber)
    .single()

  if (error || !tome) {
    redirect(`/novels/${novelId}`)
  }

  // Sort chapters
  const chapters = (tome.chapters || []).sort(
    (a: any, b: any) => a.chapter_number - b.chapter_number
  )

  // Get next and previous tomes
  const { data: allTomes } = await supabase
    .from('tomes')
    .select('tome_number')
    .eq('novel_id', novelId)
    .order('tome_number', { ascending: true })

  const tomeNumbers = (allTomes || []).map((t: any) => t.tome_number)
  const hasPrevious = tomeNumbers.includes(tomeNumber - 1)
  const hasNext = tomeNumbers.includes(tomeNumber + 1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/novels/${novelId}`}
              className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour au roman
            </Link>
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors">
                <Download className="w-5 h-5" />
                Exporter (PDF)
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Tome Header */}
        <div className="mb-8">
          <div className="text-center mb-8">
            {tome.cover_image_url && (
              <div className="mb-6">
                <img
                  src={tome.cover_image_url}
                  alt={`Tome ${tomeNumber}`}
                  className="w-64 h-auto mx-auto rounded-lg shadow-2xl"
                />
              </div>
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              {novel.title}
            </h1>
            <p className="text-2xl text-purple-200 mb-4">Tome {tomeNumber}</p>
            {tome.summary && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 max-w-2xl mx-auto">
                <p className="text-purple-100 italic">{tome.summary}</p>
              </div>
            )}
          </div>
        </div>

        {/* Chapters */}
        <div className="space-y-12 mb-12">
          {chapters.map((chapter: any) => (
            <article
              key={chapter.id}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20"
            >
              <h2 className="text-2xl font-bold text-white mb-6 pb-4 border-b border-white/20">
                {chapter.title}
              </h2>
              <div
                className="prose prose-invert prose-lg max-w-none text-purple-50"
                style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.8',
                }}
              >
                {chapter.content}
              </div>
              <div className="mt-6 pt-4 border-t border-white/20 text-sm text-purple-300">
                {chapter.word_count.toLocaleString()} mots
              </div>
            </article>
          ))}
        </div>

        {/* Cliffhanger */}
        {tome.cliffhanger && (
          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-lg rounded-xl p-8 border border-purple-500/50 mb-12">
            <h3 className="text-xl font-bold text-white mb-4">
              À suivre...
            </h3>
            <p className="text-purple-100 italic text-lg">{tome.cliffhanger}</p>
          </div>
        )}

        {/* Character Evolution */}
        {tome.character_evolution &&
          Object.keys(tome.character_evolution).length > 0 && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-12">
              <h3 className="text-xl font-bold text-white mb-4">
                Évolution des personnages
              </h3>
              <div className="space-y-3">
                {Object.entries(tome.character_evolution as Record<string, string>).map(
                  ([character, evolution]) => (
                    <div key={character} className="bg-black/20 rounded-lg p-4">
                      <p className="text-purple-300 font-semibold mb-1">{character}</p>
                      <p className="text-purple-100 text-sm">{evolution}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        {/* Open Arcs */}
        {Array.isArray(tome.open_arcs) && tome.open_arcs.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-12">
            <h3 className="text-xl font-bold text-white mb-4">
              Intrigues en cours
            </h3>
            <ul className="space-y-2">
              {tome.open_arcs.map((arc: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-purple-100">
                  <span className="text-purple-400">•</span>
                  <span>{arc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {hasPrevious ? (
            <Link
              href={`/novels/${novelId}/tomes/${tomeNumber - 1}`}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Tome {tomeNumber - 1}
            </Link>
          ) : (
            <div />
          )}

          {hasNext ? (
            <Link
              href={`/novels/${novelId}/tomes/${tomeNumber + 1}`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              Tome {tomeNumber + 1}
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </Link>
          ) : (
            <Link
              href={`/novels/${novelId}`}
              className="inline-flex items-center gap-2 bg-purple-500/30 hover:bg-purple-500/50 text-white px-6 py-3 rounded-lg font-semibold transition-all border border-purple-500/50"
            >
              <BookOpen className="w-5 h-5" />
              Générer le tome suivant
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
