'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react'
import { GENRES, WRITING_STYLES, COVER_STYLES } from '@/types'

const MATURITY_LEVELS = [
  { value: 'youth', label: 'Jeunesse', description: '8-12 ans' },
  { value: 'teen', label: 'Adolescent', description: '13-17 ans' },
  { value: 'adult', label: 'Adulte', description: '18+ ans' },
]

export default function GeneratePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [heroName, setHeroName] = useState('')
  const [secondaryCharacters, setSecondaryCharacters] = useState('')
  const [theme, setTheme] = useState('')
  const [writingStyle, setWritingStyle] = useState('')
  const [maturityLevel, setMaturityLevel] = useState<'youth' | 'teen' | 'adult'>('adult')
  const [coverStyle, setCoverStyle] = useState('')

  const handleCreateNovel = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/novels/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          genre,
          hero_name: heroName,
          secondary_characters: secondaryCharacters.split(',').map((s) => s.trim()),
          theme,
          writing_style: writingStyle,
          maturity_level: maturityLevel,
          cover_style: coverStyle,
        }),
      })

      if (!response.ok) throw new Error('Erreur lors de la création')

      const { novel } = await response.json()
      router.push(`/novels/${novel.id}`)
    } catch (error) {
      console.error(error)
      alert('Erreur lors de la création du roman')
    } finally {
      setLoading(false)
    }
  }

  const canProceedStep1 = title && genre && heroName
  const canProceedStep2 = theme && writingStyle && maturityLevel
  const canProceedStep3 = coverStyle

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-10 h-10 text-purple-300" />
            <h1 className="text-4xl font-bold text-white">Créez votre univers</h1>
          </div>
          <p className="text-purple-200">
            Définissez les paramètres de votre roman personnalisé
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full mx-1 ${
                  s <= step ? 'bg-purple-500' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          <div className="text-center text-purple-200 text-sm">
            Étape {step} sur 3
          </div>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
          {/* Step 1: Base Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Informations de base</h2>

              <div>
                <label className="block text-sm font-medium text-purple-100 mb-2">
                  Titre du roman
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Les Chroniques de..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-100 mb-2">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="" className="bg-gray-900">
                    Sélectionnez un genre
                  </option>
                  {GENRES.map((g) => (
                    <option key={g} value={g} className="bg-gray-900">
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-100 mb-2">
                  Nom du héros
                </label>
                <input
                  type="text"
                  value={heroName}
                  onChange={(e) => setHeroName(e.target.value)}
                  placeholder="Alex"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-100 mb-2">
                  Personnages secondaires (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={secondaryCharacters}
                  onChange={(e) => setSecondaryCharacters(e.target.value)}
                  placeholder="Marie, Thomas, Dr. Chen"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          {/* Step 2: Writing Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Style et ton</h2>

              <div>
                <label className="block text-sm font-medium text-purple-100 mb-2">
                  Thème principal
                </label>
                <textarea
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Ex: La quête de soi dans un monde divisé entre magie et technologie..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-100 mb-2">
                  Style d'écriture
                </label>
                <select
                  value={writingStyle}
                  onChange={(e) => setWritingStyle(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="" className="bg-gray-900">
                    Sélectionnez un style
                  </option>
                  {WRITING_STYLES.map((s) => (
                    <option key={s} value={s} className="bg-gray-900">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-100 mb-3">
                  Niveau de maturité
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {MATURITY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setMaturityLevel(level.value as any)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        maturityLevel === level.value
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-white font-semibold">{level.label}</div>
                      <div className="text-purple-200 text-sm">{level.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Visual */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Style visuel</h2>

              <div>
                <label className="block text-sm font-medium text-purple-100 mb-3">
                  Style de couverture
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {COVER_STYLES.map((style) => (
                    <button
                      key={style}
                      onClick={() => setCoverStyle(style)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        coverStyle === style
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-white font-semibold text-center">{style}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-purple-500/20 border border-purple-500/50 rounded-lg p-4 mt-6">
                <h3 className="text-white font-semibold mb-2">Récapitulatif</h3>
                <div className="text-purple-100 text-sm space-y-1">
                  <p>
                    <strong>Roman :</strong> {title}
                  </p>
                  <p>
                    <strong>Genre :</strong> {genre}
                  </p>
                  <p>
                    <strong>Héros :</strong> {heroName}
                  </p>
                  <p>
                    <strong>Style :</strong> {writingStyle} - {maturityLevel}
                  </p>
                  <p>
                    <strong>Couverture :</strong> {coverStyle}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                Précédent
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)
                }
                className="ml-auto flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-700 text-white rounded-lg font-semibold transition-all disabled:cursor-not-allowed"
              >
                Suivant
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleCreateNovel}
                disabled={!canProceedStep3 || loading}
                className="ml-auto flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-purple-700 disabled:to-blue-700 text-white rounded-lg font-semibold transition-all disabled:cursor-not-allowed"
              >
                {loading ? 'Création...' : 'Créer mon roman'}
                <Sparkles className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
