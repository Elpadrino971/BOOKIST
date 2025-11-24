-- Add generation jobs table for async processing
CREATE TABLE IF NOT EXISTS public.generation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
    tome_number INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    progress INTEGER DEFAULT 0, -- 0-100
    current_step TEXT, -- 'chapter_1', 'chapter_2', 'chapter_3', 'cover', 'metadata'
    tome_id UUID REFERENCES public.tomes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add generation logs table for monitoring
CREATE TABLE IF NOT EXISTS public.generation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.generation_jobs(id) ON DELETE CASCADE,
    tome_id UUID REFERENCES public.tomes(id) ON DELETE SET NULL,
    model_used TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 6) DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_id ON public.generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON public.generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_created_at ON public.generation_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_generation_logs_user_id ON public.generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_created_at ON public.generation_logs(created_at);

-- Enable Row Level Security
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for generation_jobs
CREATE POLICY "Users can view their own jobs"
    ON public.generation_jobs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs"
    ON public.generation_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
    ON public.generation_jobs FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for generation_logs
CREATE POLICY "Users can view their own logs"
    ON public.generation_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage logs"
    ON public.generation_logs FOR ALL
    USING (true);

-- Trigger for updated_at on generation_jobs
CREATE TRIGGER set_updated_at_generation_jobs
    BEFORE UPDATE ON public.generation_jobs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to check rate limit (max 5 generations per hour)
CREATE OR REPLACE FUNCTION check_rate_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    recent_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO recent_count
    FROM public.generation_jobs
    WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 hour';

    RETURN recent_count < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending jobs (for worker)
CREATE OR REPLACE FUNCTION get_pending_job()
RETURNS TABLE (
    job_id UUID,
    user_id UUID,
    novel_id UUID,
    tome_number INTEGER
) AS $$
BEGIN
    RETURN QUERY
    UPDATE public.generation_jobs
    SET status = 'processing',
        started_at = NOW(),
        updated_at = NOW()
    WHERE id = (
        SELECT id FROM public.generation_jobs
        WHERE status = 'pending'
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    RETURNING
        public.generation_jobs.id,
        public.generation_jobs.user_id,
        public.generation_jobs.novel_id,
        public.generation_jobs.tome_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
