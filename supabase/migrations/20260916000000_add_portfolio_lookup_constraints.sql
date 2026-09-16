ALTER TABLE public.portfolios
    ADD COLUMN IF NOT EXISTS cumulative_deposits NUMERIC(20, 8) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cumulative_withdrawals NUMERIC(20, 8) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS performance DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS share_slug TEXT;

UPDATE public.portfolios
SET cumulative_deposits = 0,
    cumulative_withdrawals = 0,
    performance = 0,
    is_public = FALSE
WHERE cumulative_deposits IS NULL
   OR cumulative_withdrawals IS NULL
   OR performance IS NULL
   OR is_public IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.portfolios
        GROUP BY user_id, name
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cannot create unique portfolio names: duplicate (user_id, name) rows exist';
    END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_portfolios_user_name
    ON public.portfolios (user_id, name);

CREATE UNIQUE INDEX IF NOT EXISTS ux_portfolios_share_slug
    ON public.portfolios (share_slug)
    WHERE share_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_portfolios_public_performance
    ON public.portfolios (is_public, performance DESC);
