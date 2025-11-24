import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, Plus, TrendingUp, Zap } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch novels
  const { data: novels } = await supabase
    .from('novels')
    .select(`
      *,
      tomes (count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch usage stats
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const { data: usage } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', user.id)
    .eq('month', currentMonth)
    .single()

  const subscriptionTier = profile?.subscription_tier || 'free'
  const tomesGenerated = usage?.tomes_generated || 0

  // Calculate limits
  const limits: Record<string, number> = {
    free: 1,
    starter: 3,
    basic: 8,
    pro: 20,
  }
  const tomeLimit = limits[subscriptionTier] || 1
  const remainingTomes = Math.max(0, tomeLimit - tomesGenerated)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-purple-300" />
              <h1 className="text-2xl font-bold text-white">Bookist</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/subscription"
                className="text-purple-200 hover:text-white transition-colors"
              >
                {subscriptionTier === 'free' ? 'Passer à Pro' : 'Mon abonnement'}
              </Link>
              <form
                action={async () => {
                  'use server'
                  const supabase = await createClient()
                  await supabase.auth.signOut()
                  redirect('/')
                }}
              >
                <button
                  type="submit"
                  className="text-purple-200 hover:text-white transition-colors"
                >
                  Déconnexion
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-8 h-8 text-purple-300" />
              <h3 className="text-white font-semibold">Mes Romans</h3>
            </div>
            <p className="text-3xl font-bold text-white">{novels?.length || 0}</p>
            <p className="text-purple-200 text-sm">Romans créés</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-8 h-8 text-blue-300" />
              <h3 className="text-white font-semibold">Tomes ce mois</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {tomesGenerated} / {tomeLimit}
            </p>
            <p className="text-purple-200 text-sm">
              {remainingTomes} tome{remainingTomes > 1 ? 's' : ''} restant{remainingTomes > 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 text-indigo-300" />
              <h3 className="text-white font-semibold">Abonnement</h3>
            </div>
            <p className="text-3xl font-bold text-white capitalize">{subscriptionTier}</p>
            <Link
              href="/subscription"
              className="text-purple-300 hover:text-purple-100 text-sm underline"
            >
              {subscriptionTier === 'free' ? 'Passer à Pro' : 'Gérer'}
            </Link>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-8">
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Créer un nouveau roman
          </Link>
        </div>

        {/* Novels Grid */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Mes Romans</h2>

          {!novels || novels.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 border border-white/20 text-center">
              <BookOpen className="w-16 h-16 text-purple-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Aucun roman pour le moment
              </h3>
              <p className="text-purple-200 mb-6">
                Créez votre premier roman personnalisé avec l'IA
              </p>
              <Link
                href="/generate"
                className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                <Plus className="w-5 h-5" />
                Commencer maintenant
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {novels.map((novel: any) => (
                <Link
                  key={novel.id}
                  href={`/novels/${novel.id}`}
                  className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all transform hover:scale-105"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-white flex-1">{novel.title}</h3>
                    <span className="text-xs bg-purple-500/30 text-purple-200 px-2 py-1 rounded">
                      {novel.genre}
                    </span>
                  </div>
                  <p className="text-purple-100 text-sm mb-4 line-clamp-2">
                    {novel.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-purple-300">
                      {novel.total_tomes} tome{novel.total_tomes > 1 ? 's' : ''}
                    </span>
                    <span className="text-blue-300">{novel.hero_name}</span>
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
