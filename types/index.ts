export interface Novel {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  genre: string;
  hero_name: string;
  secondary_characters: string[];
  theme: string;
  writing_style: string;
  maturity_level: 'youth' | 'teen' | 'adult';
  cover_image_url: string | null;
  cover_style: string;
  total_tomes: number;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface Tome {
  id: string;
  novel_id: string;
  tome_number: number;
  title: string;
  summary: string | null;
  word_count: number;
  cover_image_url: string | null;
  cliffhanger: string | null;
  character_evolution: Record<string, string>;
  open_arcs: string[];
  status: 'draft' | 'completed';
  created_at: string;
  updated_at: string;
  chapters?: Chapter[];
}

export interface Chapter {
  id: string;
  tome_id: string;
  chapter_number: number;
  title: string;
  content: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  subscription_tier: 'free' | 'basic' | 'pro';
  subscription_status: 'active' | 'canceled' | 'past_due' | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface NovelCreationForm {
  title: string;
  genre: string;
  hero_name: string;
  secondary_characters: string[];
  theme: string;
  writing_style: string;
  maturity_level: 'youth' | 'teen' | 'adult';
  cover_style: string;
}

export interface TomeGenerationResult {
  tome: Tome;
  chapters: Chapter[];
  cover_url: string | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  tomes_per_month: number;
  features: string[];
  stripe_price_id?: string;
}

export const GENRES = [
  'Fantasy',
  'Science-Fiction',
  'Romance',
  'Thriller',
  'Aventure',
  'Mystère',
  'Horreur',
  'Historique',
  'Young Adult',
  'Contemporain',
] as const;

export const WRITING_STYLES = [
  'Poétique',
  'Direct',
  'Descriptif',
  'Dialogué',
  'Humoristique',
  'Sombre',
  'Épique',
] as const;

export const COVER_STYLES = [
  'Réaliste',
  'Manga',
  'Cartoon',
  'Dark Fantasy',
  'YA Modern',
  'Minimaliste',
  'Vintage',
] as const;
