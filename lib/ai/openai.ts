import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

export async function generateChapter(params: GenerateChapterParams): Promise<string> {
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
Tu dois créer du contenu captivant et cohérent.`

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
- Faire progresser l'histoire
${chapterNumber === 3 ? '- Se terminer par un cliffhanger intense qui donne envie de lire le tome suivant' : ''}

Écris uniquement le contenu du chapitre, sans titre ni numéro de chapitre.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.9,
    max_tokens: 4000,
  })

  return completion.choices[0].message.content || ''
}

export interface GenerateSummaryParams {
  chapters: Array<{ title: string; content: string }>
  heroName: string
}

export async function generateTomeSummary(params: GenerateSummaryParams) {
  const { chapters, heroName } = params

  const allContent = chapters.map((ch, i) => `Chapitre ${i + 1}: ${ch.title}\n${ch.content}`).join('\n\n')

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Tu es un expert en synthèse littéraire. Tu dois créer un résumé concis mais complet.',
      },
      {
        role: 'user',
        content: `Crée un résumé du tome suivant (2-3 paragraphes) :\n\n${allContent}\n\nRésumé :`,
      },
    ],
    temperature: 0.7,
    max_tokens: 500,
  })

  return completion.choices[0].message.content || ''
}

export interface GenerateCoverParams {
  title: string
  genre: string
  heroName: string
  coverStyle: string
  tomeNumber: number
}

export async function generateCoverImage(params: GenerateCoverParams): Promise<string> {
  const { title, genre, heroName, coverStyle, tomeNumber } = params

  const prompt = `Book cover for tome ${tomeNumber} of "${title}", ${genre} genre.
Style: ${coverStyle}
Main character: ${heroName}
Professional book cover design, high quality, dramatic, eye-catching, suitable for a novel.
No text on the cover.`

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
  })

  return response.data[0].url || ''
}

export interface AnalyzeCharacterEvolutionParams {
  chapters: Array<{ title: string; content: string }>
  heroName: string
  secondaryCharacters: string[]
}

export async function analyzeCharacterEvolution(params: AnalyzeCharacterEvolutionParams) {
  const { chapters, heroName, secondaryCharacters } = params

  const allContent = chapters.map((ch) => ch.content).join('\n\n')

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Tu es un analyste littéraire expert. Analyse l\'évolution des personnages de manière concise.',
      },
      {
        role: 'user',
        content: `Analyse l'évolution des personnages suivants dans ce tome :

Héros : ${heroName}
Personnages secondaires : ${secondaryCharacters.join(', ')}

Texte :
${allContent}

Pour chaque personnage, donne UNE phrase décrivant son évolution dans ce tome.
Format JSON : { "nom_personnage": "description évolution" }`,
      },
    ],
    temperature: 0.7,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  })

  return JSON.parse(completion.choices[0].message.content || '{}')
}

export async function extractOpenArcs(chapters: Array<{ content: string }>): Promise<string[]> {
  const allContent = chapters.map((ch) => ch.content).join('\n\n')

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Tu es un expert en narration. Identifie les intrigues non résolues.',
      },
      {
        role: 'user',
        content: `Identifie les 3-5 principaux arcs narratifs laissés ouverts dans ce texte :

${allContent}

Liste-les sous forme de tableau JSON : ["arc 1", "arc 2", ...]`,
      },
    ],
    temperature: 0.7,
    max_tokens: 300,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(completion.choices[0].message.content || '{"arcs":[]}')
  return result.arcs || []
}
