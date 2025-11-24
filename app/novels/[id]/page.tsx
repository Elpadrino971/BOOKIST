import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Plus, Loader2 } from 'lucide-react'
import GenerateTomeButton from '@/components/novels/GenerateTomeButton'

export default async function NovelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch novel with tomes
  const { data: novel, error } = await supabase
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

  if (error || !novel) {
    redirect('/dashboard')
  }

  // Sort tomes by number
  const tomes = (novel.tomes || []).sort((a: any, b: any) => a.tome_number - b.tome_number)

  // Get usage info
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const currentMonth = new Date().toISOString().slice(0, 7)
  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', user.id)
    .eq('month', currentMonth)
    .single()

  const subscriptionTier = profile?.subscription_tier || 'free'
  const tomesGenerated = usage?.tomes_generated || 0

  const limits: Record<string, number> = {
    free: 1,
    starter: 3,
    basic: 8,
    pro: 20,
  }
  const tomeLimit = limits[subscriptionTier] || 1
  const canGenerate = tomesGenerated < tomeLimit

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-purple-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour au dashboard
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Novel Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">{novel.title}</h1>
              <div className="flex items-center gap-4 text-sm text-purple-200 mb-4">
                <span className="bg-purple-500/30 px-3 py-1 rounded">{novel.genre}</span>
                <span>Héros: {novel.hero_name}</span>
                <span>Style: {novel.writing_style}</span>
              </div>
            </div>
          </div>

          {novel.description && (
            <p className="text-purple-100 mb-6">{novel.description}</p>
          )}

          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-black/20 rounded-lg p-4">
              <p className="text-purple-300 mb-1">Thème</p>
              <p className="text-white">{novel.theme}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-4">
              <p className="text-purple-300 mb-1">Personnages secondaires</p>
              <p className="text-white">
                {Array.isArray(novel.secondary_characters)
                  ? novel.secondary_characters.join(', ')
                  : 'Aucun'}
              </p>
            </div>
            <div className="bg-black/20 rounded-lg p-4">
              <p className="text-purple-300 mb-1">Maturité</p>
              <p className="text-white capitalize">{novel.maturity_level}</p>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="mb-8">
          {canGenerate ? (
            <GenerateTomeButton
              novelId={novel.id}
              nextTomeNumber={tomes.length + 1}
            />
          ) : (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
              <p className="font-semibold mb-2">Limite mensuelle atteinte</p>
              <p className="text-sm mb-3">
                Vous avez généré {tomesGenerated}/{tomeLimit} tomes ce mois.
              </p>
              <Link
                href="/subscription"
                className="inline-block bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              >
                Passer à un plan supérieur
              </Link>
            </div>
          )}
        </div>

        {/* Tomes List */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">
            Tomes ({tomes.length})
          </h2>

          {tomes.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 border border-white/20 text-center">
              <BookOpen className="w-16 h-16 text-purple-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Aucun tome généré
              </h3>
              <p className="text-purple-200">
                Cliquez sur "Générer le tome 1" pour commencer votre saga
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tomes.map((tome: any) => (
                <Link
                  key={tome.id}
                  href={`/novels/${novel.id}/tomes/${tome.tome_number}`}
                  className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105"
                >
                  {tome.cover_image_url && (
                    <div className="aspect-[3/4] bg-gray-800 relative">
                      <img
                        src={tome.cover_image_url}
                        alt={tome.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">
                      Tome {tome.tome_number}
                    </h3>
                    {tome.summary && (
                      <p className="text-purple-100 text-sm mb-4 line-clamp-3">
                        {tome.summary}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-purple-300">
                        {tome.word_count.toLocaleString()} mots
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          tome.status === 'completed'
                            ? 'bg-green-500/30 text-green-200'
                            : 'bg-yellow-500/30 text-yellow-200'
                        }`}
                      >
                        {tome.status === 'completed' ? 'Terminé' : 'En cours'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
