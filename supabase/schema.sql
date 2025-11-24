-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro')),
    subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due')),
    stripe_customer_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Novels table
CREATE TABLE IF NOT EXISTS public.novels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    genre TEXT NOT NULL,
    hero_name TEXT NOT NULL,
    secondary_characters JSONB DEFAULT '[]'::jsonb,
    theme TEXT NOT NULL,
    writing_style TEXT NOT NULL,
    maturity_level TEXT NOT NULL CHECK (maturity_level IN ('youth', 'teen', 'adult')),
    cover_image_url TEXT,
    cover_style TEXT NOT NULL,
    total_tomes INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tomes table
CREATE TABLE IF NOT EXISTS public.tomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
    tome_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    word_count INTEGER NOT NULL DEFAULT 0,
    cover_image_url TEXT,
    cliffhanger TEXT,
    character_evolution JSONB DEFAULT '{}'::jsonb,
    open_arcs JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(novel_id, tome_number)
);

-- Chapters table
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tome_id UUID NOT NULL REFERENCES public.tomes(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    word_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tome_id, chapter_number)
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- Format: YYYY-MM
    tomes_generated INTEGER NOT NULL DEFAULT 0,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    covers_generated INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, month)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_novels_user_id ON public.novels(user_id);
CREATE INDEX IF NOT EXISTS idx_novels_status ON public.novels(status);
CREATE INDEX IF NOT EXISTS idx_tomes_novel_id ON public.tomes(novel_id);
CREATE INDEX IF NOT EXISTS idx_chapters_tome_id ON public.chapters(tome_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id_month ON public.usage_tracking(user_id, month);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policies for novels
CREATE POLICY "Users can view their own novels"
    ON public.novels FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own novels"
    ON public.novels FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own novels"
    ON public.novels FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own novels"
    ON public.novels FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for tomes
CREATE POLICY "Users can view tomes from their novels"
    ON public.tomes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.novels
            WHERE novels.id = tomes.novel_id
            AND novels.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert tomes to their novels"
    ON public.tomes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.novels
            WHERE novels.id = novel_id
            AND novels.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update tomes from their novels"
    ON public.tomes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.novels
            WHERE novels.id = tomes.novel_id
            AND novels.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tomes from their novels"
    ON public.tomes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.novels
            WHERE novels.id = tomes.novel_id
            AND novels.user_id = auth.uid()
        )
    );

-- RLS Policies for chapters
CREATE POLICY "Users can view chapters from their tomes"
    ON public.chapters FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tomes
            JOIN public.novels ON novels.id = tomes.novel_id
            WHERE tomes.id = chapters.tome_id
            AND novels.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert chapters to their tomes"
    ON public.chapters FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tomes
            JOIN public.novels ON novels.id = tomes.novel_id
            WHERE tomes.id = tome_id
            AND novels.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update chapters from their tomes"
    ON public.chapters FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.tomes
            JOIN public.novels ON novels.id = tomes.novel_id
            WHERE tomes.id = chapters.tome_id
            AND novels.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete chapters from their tomes"
    ON public.chapters FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.tomes
            JOIN public.novels ON novels.id = tomes.novel_id
            WHERE tomes.id = chapters.tome_id
            AND novels.user_id = auth.uid()
        )
    );

-- RLS Policies for usage tracking
CREATE POLICY "Users can view their own usage"
    ON public.usage_tracking FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage tracking"
    ON public.usage_tracking FOR ALL
    USING (true);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_novels
    BEFORE UPDATE ON public.novels
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_tomes
    BEFORE UPDATE ON public.tomes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_chapters
    BEFORE UPDATE ON public.chapters
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_usage_tracking
    BEFORE UPDATE ON public.usage_tracking
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to increment novel tome count
CREATE OR REPLACE FUNCTION public.increment_novel_tome_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.novels
    SET total_tomes = total_tomes + 1
    WHERE id = NEW.novel_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment tome count when a new tome is created
CREATE TRIGGER increment_tome_count
    AFTER INSERT ON public.tomes
    FOR EACH ROW EXECUTE FUNCTION public.increment_novel_tome_count();
