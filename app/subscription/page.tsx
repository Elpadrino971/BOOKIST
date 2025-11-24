import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Check, Sparkles } from 'lucide-react'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription/plans'

export default async function SubscriptionPage() {
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

  const currentTier = profile?.subscription_tier || 'free'

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

      <div className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Générez des romans IA personnalisés adaptés à votre rythme de lecture
          </p>
        </div>

        {/* Current Plan */}
        {currentTier !== 'free' && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-green-200 max-w-2xl mx-auto mb-8 text-center">
            <p className="font-semibold">
              Plan actuel : <span className="capitalize">{currentTier}</span>
            </p>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isCurrent = currentTier === plan.id
            const isUpgrade = !isCurrent

            return (
              <div
                key={plan.id}
                className={`bg-white/10 backdrop-blur-lg rounded-xl p-8 border-2 transition-all ${
                  plan.popular
                    ? 'border-purple-500 transform scale-105 shadow-2xl'
                    : 'border-white/20'
                } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
              >
                {plan.popular && (
                  <div className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                    POPULAIRE
                  </div>
                )}

                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">
                    {plan.price === 0 ? 'Gratuit' : `${plan.price}€`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-purple-200 text-sm">/mois</span>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-purple-100">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button
                    disabled
                    className="w-full bg-green-500/30 text-green-200 py-3 rounded-lg font-semibold cursor-not-allowed"
                  >
                    Plan actuel
                  </button>
                ) : plan.id === 'free' ? (
                  <button
                    disabled
                    className="w-full bg-white/10 text-purple-300 py-3 rounded-lg font-semibold cursor-not-allowed"
                  >
                    Plan de base
                  </button>
                ) : (
                  <form action={`/api/stripe/checkout`} method="POST">
                    <input type="hidden" name="plan" value={plan.id} />
                    <button
                      type="submit"
                      className={`w-full py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white'
                          : 'bg-purple-500 hover:bg-purple-600 text-white'
                      }`}
                    >
                      {isUpgrade ? 'Passer à ce plan' : 'Choisir ce plan'}
                    </button>
                  </form>
                )}
              </div>
            )
          })}
        </div>

        {/* FAQ / Info */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-2">
                Puis-je changer de plan à tout moment ?
              </h3>
              <p className="text-purple-100 text-sm">
                Oui, vous pouvez upgrader ou downgrader votre plan à tout moment.
                Les changements sont effectifs immédiatement.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-2">
                Que se passe-t-il si j'atteins ma limite mensuelle ?
              </h3>
              <p className="text-purple-100 text-sm">
                Vous pouvez toujours lire vos romans existants. Pour générer de
                nouveaux tomes, vous devrez attendre le mois suivant ou passer à un
                plan supérieur.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-2">
                Les tomes générés sont-ils conservés ?
              </h3>
              <p className="text-purple-100 text-sm">
                Oui, tous vos romans et tomes sont conservés indéfiniment, même si
                vous repassez au plan gratuit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
