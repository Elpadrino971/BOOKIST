'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface GenerateTomeButtonAsyncProps {
  novelId: string
  nextTomeNumber: number
}

export default function GenerateTomeButtonAsync({
  novelId,
  nextTomeNumber,
}: GenerateTomeButtonAsyncProps) {
  const router = useRouter()
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>(
    'idle'
  )
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [error, setError] = useState('')
  const [tomeId, setTomeId] = useState<string | null>(null)

  const handleGenerate = async () => {
    setError('')

    try {
      const response = await fetch(`/api/novels/${novelId}/generate-tome-async`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limit error
          setError(data.error || 'Limite de génération atteinte')
        } else {
          throw new Error(data.error || 'Erreur lors de la génération')
        }
        return
      }

      setJobId(data.jobId)
      setStatus(data.status)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Poll job status
  useEffect(() => {
    if (!jobId || status === 'completed' || status === 'failed') {
      return
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}/status`)
        const data = await response.json()

        if (response.ok) {
          setStatus(data.status)
          setProgress(data.progress || 0)
          setCurrentStep(data.currentStep || '')

          if (data.status === 'completed') {
            setTomeId(data.tomeId)
            clearInterval(pollInterval)

            // Redirect after a short delay
            setTimeout(() => {
              router.push(`/novels/${novelId}/tomes/${nextTomeNumber}`)
              router.refresh()
            }, 2000)
          } else if (data.status === 'failed') {
            setError(data.errorMessage || 'La génération a échoué')
            clearInterval(pollInterval)
          }
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(pollInterval)
  }, [jobId, status, novelId, nextTomeNumber, router])

  const isGenerating = status === 'pending' || status === 'processing'

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={isGenerating || status === 'completed'}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-purple-700 disabled:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
      >
        {status === 'completed' ? (
          <>
            <CheckCircle className="w-5 h-5" />
            Tome généré !
          </>
        ) : isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Génération en cours...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Générer le tome {nextTomeNumber}
          </>
        )}
      </button>

      {/* Progress indicator */}
      {isGenerating && (
        <div className="mt-4 bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-200 font-semibold">
              {currentStep || 'Initialisation...'}
            </p>
            <span className="text-blue-300 text-sm">{progress}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-blue-900/50 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-400 to-purple-400 h-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-blue-300 text-xs mt-3">
            La génération prend 2-3 minutes. Vous pouvez fermer cette page, vous serez redirigé
            automatiquement.
          </p>
        </div>
      )}

      {/* Success message */}
      {status === 'completed' && (
        <div className="mt-4 bg-green-500/20 border border-green-500/50 text-green-200 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5" />
            <p className="font-semibold">Tome généré avec succès !</p>
          </div>
          <p className="text-sm">Redirection vers le lecteur...</p>
        </div>
      )}

      {/* Error message */}
      {error && status !== 'completed' && (
        <div className="mt-4 bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5" />
            <p className="font-semibold">Erreur</p>
          </div>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
