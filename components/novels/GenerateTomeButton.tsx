'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2 } from 'lucide-react'

interface GenerateTomeButtonProps {
  novelId: string
  nextTomeNumber: number
}

export default function GenerateTomeButton({ novelId, nextTomeNumber }: GenerateTomeButtonProps) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')

    try {
      const response = await fetch(`/api/novels/${novelId}/generate-tome`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération')
      }

      // Redirect to the newly generated tome
      router.push(`/novels/${novelId}/tomes/${nextTomeNumber}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-purple-700 disabled:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
      >
        {generating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Génération en cours... (2-3 min)
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Générer le tome {nextTomeNumber}
          </>
        )}
      </button>

      {error && (
        <div className="mt-4 bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {generating && (
        <div className="mt-4 bg-blue-500/20 border border-blue-500/50 text-blue-200 p-3 rounded-lg text-sm">
          <p className="font-semibold mb-1">Génération en cours...</p>
          <p className="text-xs">
            L'IA crée vos 3 chapitres personnalisés. Cela peut prendre 2-3 minutes.
            Vous pouvez fermer cette page, vous serez redirigé automatiquement.
          </p>
        </div>
      )}
    </div>
  )
}
