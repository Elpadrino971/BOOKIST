# 📚 Bookist - Le Netflix des Romans IA Personnalisés

Plateforme de génération de romans personnalisés avec l'IA, modèle d'abonnement mensuel.

![Stack](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)
![Stripe](https://img.shields.io/badge/Stripe-Payments-purple?logo=stripe)

---

## 🎯 Concept

**Bookist** permet aux utilisateurs de créer des sagas personnalisées avec l'IA :
- ✨ Créez votre univers (héros, genre, style)
- 📖 Générez des tomes tome après tome
- 🎨 Couvertures IA générées automatiquement
- 🔄 Cohérence narrative entre les tomes
- 💰 Modèle d'abonnement rentable

---

## 🏗️ Architecture

### Stack Technique

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de données**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **IA**: OpenAI (GPT-4o, DALL-E) + Anthropic (Claude 3.5 Sonnet)
- **Paiements**: Stripe
- **Hosting**: Vercel (recommandé)

### Structure du projet

```
bookist/
├── app/
│   ├── api/                    # API routes
│   │   ├── novels/            # Gestion des romans
│   │   ├── tomes/             # Récupération des tomes
│   │   ├── stripe/            # Stripe checkout & webhooks
│   │   └── user/              # Profil & usage
│   ├── auth/                  # Login & Register
│   ├── dashboard/             # Dashboard utilisateur
│   ├── generate/              # Wizard création roman
│   ├── novels/[id]/          # Détails roman & lecteur tomes
│   └── subscription/          # Page abonnements
├── components/
│   └── novels/               # Composants réutilisables
├── lib/
│   ├── ai/                   # Intégrations OpenAI & Anthropic
│   ├── stripe/               # Client Stripe
│   ├── supabase/             # Client Supabase
│   ├── subscription/         # Logique plans & limites
│   └── usage/                # Tracking d'utilisation
├── supabase/
│   ├── schema.sql            # Schéma de base de données
│   └── functions.sql         # Fonctions PostgreSQL
└── types/                    # Types TypeScript
```

---

## 🚀 Installation

### Prérequis

- Node.js 18+
- Compte Supabase
- Compte OpenAI
- Compte Anthropic
- Compte Stripe

### 1. Cloner et installer

```bash
git clone <repo-url>
cd BOOKIST
npm install
```

### 2. Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Allez dans `SQL Editor`
3. Exécutez le contenu de `supabase/schema.sql`
4. Exécutez le contenu de `supabase/functions.sql`
5. Récupérez vos clés dans `Settings > API`

### 3. Configuration OpenAI

1. Créez une clé API sur [platform.openai.com](https://platform.openai.com)
2. Copiez votre clé

### 4. Configuration Anthropic

1. Créez une clé API sur [console.anthropic.com](https://console.anthropic.com)
2. Copiez votre clé

### 5. Configuration Stripe

1. Créez un compte sur [stripe.com](https://stripe.com)
2. Créez 3 produits d'abonnement :
   - **Starter**: 4.99€/mois
   - **Basic**: 9.99€/mois
   - **Pro**: 19.99€/mois
3. Récupérez les `price_id` de chaque produit
4. Configurez le webhook :
   - URL: `https://votre-domaine.com/api/stripe/webhook`
   - Événements: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Récupérez le secret du webhook

### 6. Variables d'environnement

Créez un fichier `.env` à la racine :

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Worker (optional, for production security)
WORKER_SECRET=your_random_secret_string
```

### 7. Lancer le projet

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

---

## 💰 Modèle de Monétisation

### Plans d'abonnement

| Plan | Prix | Tomes/mois | Modèle IA | Cover | Coût IA/tome |
|------|------|------------|-----------|-------|--------------|
| **Free** | 0€ | 1 | GPT-4o-mini | ❌ | $0.08 |
| **Starter** | 4.99€ | 3 | Claude Haiku | DALL-E 2 | $0.15 |
| **Basic** | 9.99€ | 8 | Claude Haiku | DALL-E 3 | $0.20 |
| **Pro** | 19.99€ | 20 | GPT-4o | DALL-E 3 | $0.65 |

### Calcul de rentabilité (exemple)

**Scénario conservateur** :
- 100 users Free : 1 tome/mois → $8 de coûts IA
- 50 users Starter : 3 tomes/mois → $22.50 de coûts IA
- 30 users Basic : 8 tomes/mois → $48 de coûts IA
- 20 users Pro : 10 tomes/mois → $130 de coûts IA

**Total coûts IA** : ~$208/mois
**Total revenus** : (50 × 4.99) + (30 × 9.99) + (20 × 19.99) = **$949/mois**
**Marge brute** : **78%** ✅

---

## 📊 Fonctionnalités

### ✅ Implémenté

- [x] Authentification utilisateur (Supabase Auth)
- [x] Wizard de création de roman (3 étapes)
- [x] Génération de tomes (3 chapitres + cliffhanger)
- [x] Couvertures IA (DALL-E)
- [x] Système de récap entre tomes
- [x] Analyse d'évolution des personnages
- [x] Extraction des arcs narratifs ouverts
- [x] Dashboard utilisateur
- [x] Lecteur de tomes (UI type ebook)
- [x] Système de limites mensuelles
- [x] Tracking d'utilisation
- [x] Sélection de modèles IA par tier
- [x] Intégration Stripe (checkout + webhooks)
- [x] Page subscription
- [x] **Jobs asynchrones** (génération en arrière-plan) ⭐
- [x] **Rate limiting** (max 5 générations/heure) ⭐
- [x] **Retry avec exponential backoff** ⭐
- [x] **Monitoring & logging** (coûts, durée, erreurs) ⭐
- [x] **Suivi de progression en temps réel** ⭐

### 🚧 À implémenter (optionnel)

- [ ] Export EPUB/PDF
- [ ] Système de cache IA (réduction coûts)
- [ ] Embeddings pour cohérence narrative (pgvector)
- [ ] Mode sombre
- [ ] Notifications email (tome prêt)
- [ ] Partage social
- [ ] Admin dashboard (analytics)

---

## 🔧 Développement

### Scripts disponibles

```bash
npm run dev      # Serveur de développement
npm run build    # Build production
npm run start    # Serveur production
npm run lint     # Linter
```

### Structure de la base de données

**Tables principales** :
- `profiles` - Utilisateurs + abonnements
- `novels` - Romans créés
- `tomes` - Tomes de chaque roman
- `chapters` - Chapitres de chaque tome
- `usage_tracking` - Utilisation mensuelle par user

**Sécurité** :
- Row Level Security (RLS) activé sur toutes les tables
- Les utilisateurs ne peuvent accéder qu'à leurs propres données

---

## 🎨 Workflow Utilisateur

1. **Inscription** → Plan Free par défaut
2. **Créer un roman** → Wizard en 3 étapes (infos, style, visuel)
3. **Générer Tome 1** → 3 chapitres + cliffhanger (2-3 min)
4. **Lire le tome** → Interface type ebook
5. **Générer Tome 2** → L'IA utilise le récap du tome 1
6. **Limite atteinte** → Upgrade vers plan payant
7. **Continuer la saga** → Tomes illimités (selon plan)

---

## 🚀 **Nouvelles Fonctionnalités Critiques (Production-Ready)**

### ⚡ Jobs Asynchrones

La génération de tomes se fait maintenant **en arrière-plan** :

1. L'utilisateur clique sur "Générer le tome 2"
2. Un **job** est créé instantanément
3. L'utilisateur peut **fermer la page** ou naviguer ailleurs
4. Le worker traite le job en arrière-plan (2-3 min)
5. **Redirection automatique** quand c'est prêt

**Architecture** :
- Table `generation_jobs` pour stocker les jobs
- Worker API route `/api/worker/process-job`
- Polling toutes les 2 secondes côté frontend
- Sauvegarde progressive (chaque chapitre sauvegardé immédiatement)

**Avantages** :
- ✅ Pas de timeout frontend
- ✅ Meilleure UX (pas de spinner bloquant)
- ✅ Robuste face aux erreurs réseau

### 🛡️ Rate Limiting

Protection contre les abus : **max 5 générations par heure** par utilisateur.

**Implémentation** :
- Vérification dans `canUserGenerate()`
- Compte les jobs des 60 dernières minutes
- Retourne une erreur 429 avec `resetAt` si limite atteinte

**Pourquoi** : Évite qu'un utilisateur malveillant génère 100 tomes → facture OpenAI explosive

### 🔄 Retry avec Exponential Backoff

Toutes les appels IA ont maintenant un **système de retry automatique** :

```typescript
withRetryAndTimeout(
  () => generateChapter(...),
  {
    maxRetries: 3,        // 3 tentatives max
    timeout: 90000,       // 90 secondes timeout
    initialDelay: 1000,   // 1s, puis 2s, puis 4s
  }
)
```

**Avantages** :
- ✅ Résiste aux timeouts OpenAI/Anthropic
- ✅ Pas de perte de données (chaque chapitre sauvegardé avant de continuer)
- ✅ Logs automatiques des erreurs

### 📊 Monitoring & Logging

Nouvelle table `generation_logs` qui track :
- Modèle IA utilisé
- Tokens consommés
- **Coût estimé** ($$$)
- Durée de génération
- Success/failure

**Utilité** :
- Surveiller les coûts réels
- Détecter les problèmes (taux d'échec)
- Optimiser les prompts

**Accès** : Query SQL pour voir les stats
```sql
SELECT
  DATE(created_at) as date,
  model_used,
  SUM(cost_usd) as total_cost,
  COUNT(*) as generations,
  AVG(duration_ms) as avg_duration
FROM generation_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY date, model_used
ORDER BY date DESC;
```

### 📈 Suivi de Progression en Temps Réel

L'utilisateur voit la progression de la génération :

```
Génération en cours...
⏳ Generating chapter 2  [████████░░░░░░░] 60%
```

**Implémentation** :
- `updateJobProgress(jobId, 60, 'Generating chapter 2')`
- Frontend poll toutes les 2s pour mettre à jour la UI
- Smooth UX

---

## 🐛 Debugging

### Problème : Génération bloquée

- Vérifiez les clés API (OpenAI, Anthropic)
- Vérifiez les limites de votre compte IA
- Consultez les logs : `npm run dev`

### Problème : Stripe webhook ne fonctionne pas

- Vérifiez le `STRIPE_WEBHOOK_SECRET`
- Testez avec Stripe CLI : `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Problème : User non authentifié

- Vérifiez que le middleware Supabase est actif
- Consultez la console : erreurs d'auth

---

## 📈 Optimisations Recommandées

### Réduction des coûts IA (75%)

1. **Utiliser GPT-4o-mini** pour plans Free/Starter
2. **Claude Haiku** pour Basic (meilleur rapport qualité/prix)
3. **Cache des prompts** réutilisables
4. **Embeddings** pour la mémoire narrative (pgvector)

### Performance

1. **Jobs asynchrones** pour génération (Supabase Edge Functions)
2. **Suivi en temps réel** avec Supabase Realtime
3. **CDN** pour les images de couverture

---

## 📝 Licence

Ce projet est privé. Tous droits réservés.

---

## 🤝 Support

Pour toute question :
- Issues GitHub
- Email: support@bookist.app (à configurer)

---

**Fait avec ❤️ et Claude Code**
