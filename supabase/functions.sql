-- Function to increment usage tracking atomically
CREATE OR REPLACE FUNCTION increment_usage(
    p_user_id UUID,
    p_month TEXT,
    p_tomes INTEGER DEFAULT 0,
    p_tokens INTEGER DEFAULT 0,
    p_covers INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.usage_tracking (user_id, month, tomes_generated, tokens_used, covers_generated)
    VALUES (p_user_id, p_month, p_tomes, p_tokens, p_covers)
    ON CONFLICT (user_id, month)
    DO UPDATE SET
        tomes_generated = public.usage_tracking.tomes_generated + p_tomes,
        tokens_used = public.usage_tracking.tokens_used + p_tokens,
        covers_generated = public.usage_tracking.covers_generated + p_covers,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
