import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface GenerateChapterParams {
  title: string
  chapterNumber: number
  genre: string
  heroName: string
  theme: string
  writingStyle: string
  maturityLevel: string
  previousContext?: string
  targetWordCount?: number
}

export async function generateChapterClaude(params: GenerateChapterParams): Promise<string> {
  const {
    title,
    chapterNumber,
    genre,
    heroName,
    theme,
    writingStyle,
    maturityLevel,
    previousContext = '',
    targetWordCount = 2000,
  } = params

  const systemPrompt = `Tu es un écrivain professionnel spécialisé dans le genre ${genre}.
Tu écris avec un style ${writingStyle} adapté pour un public ${maturityLevel}.
Tu dois créer du contenu captivant et cohérent avec une excellente continuité narrative.`

  const userPrompt = `Écris le chapitre ${chapterNumber} "${title}" d'un roman ${genre}.

Héros principal : ${heroName}
Thème : ${theme}
Style d'écriture : ${writingStyle}
Niveau de maturité : ${maturityLevel}

${previousContext ? `Contexte précédent :\n${previousContext}\n\n` : ''}

Le chapitre doit :
- Faire environ ${targetWordCount} mots
- Être captivant et bien écrit
- Respecter le style et le genre demandés
- Faire progresser l'histoire de manière cohérente
${chapterNumber === 3 ? '- Se terminer par un cliffhanger intense qui donne envie de lire le tome suivant' : ''}

Écris uniquement le contenu du chapitre, sans titre ni numéro de chapitre.`

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    temperature: 0.9,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  })

  const textContent = message.content.find((block) => block.type === 'text')
  return textContent && 'text' in textContent ? textContent.text : ''
}

export interface GenerateRecapParams {
  previousTomes: Array<{
    tomeNumber: number
    summary: string
    cliffhanger: string | null
    characterEvolution: Record<string, string>
    openArcs: string[]
  }>
  nextTomeNumber: number
}

export async function generateRecapForNextTome(params: GenerateRecapParams): Promise<string> {
  const { previousTomes, nextTomeNumber } = params

  const context = previousTomes
    .map(
      (tome) => `
Tome ${tome.tomeNumber}:
Résumé : ${tome.summary}
Cliffhanger : ${tome.cliffhanger || 'Aucun'}
Évolution des personnages : ${JSON.stringify(tome.characterEvolution)}
Arcs ouverts : ${tome.openArcs.join(', ')}
`
    )
    .join('\n---\n')

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    temperature: 0.7,
    messages: [
      {
        role: 'user',
        content: `Tu dois créer un récap narratif pour le tome ${nextTomeNumber} d'une saga.

Voici l'historique des tomes précédents :

${context}

Crée un récap de 2-3 paragraphes qui :
1. Rappelle les événements clés
2. Met en avant les tensions non résolues
3. Prépare le terrain pour le tome ${nextTomeNumber}

Le récap doit être captivant et donner envie de continuer la lecture.`,
      },
    ],
  })

  const textContent = message.content.find((block) => block.type === 'text')
  return textContent && 'text' in textContent ? textContent.text : ''
}

export async function generateNovelPremise(params: {
  genre: string
  theme: string
  heroName: string
  secondaryCharacters: string[]
  writingStyle: string
  maturityLevel: string
}): Promise<string> {
  const { genre, theme, heroName, secondaryCharacters, writingStyle, maturityLevel } = params

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 512,
    temperature: 0.8,
    messages: [
      {
        role: 'user',
        content: `Crée une prémisse captivante pour un roman ${genre} avec les éléments suivants :

Héros : ${heroName}
Personnages secondaires : ${secondaryCharacters.join(', ')}
Thème : ${theme}
Style : ${writingStyle}
Public : ${maturityLevel}

La prémisse doit être courte (2-3 phrases) et accrocheuse, donnant envie de commencer l'histoire.`,
      },
    ],
  })

  const textContent = message.content.find((block) => block.type === 'text')
  return textContent && 'text' in textContent ? textContent.text : ''
}
