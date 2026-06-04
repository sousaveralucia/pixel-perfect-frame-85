
ALTER TABLE public.daily_validations
  ADD COLUMN IF NOT EXISTS checkin_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS checkout_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS emotional_state text,
  ADD COLUMN IF NOT EXISTS mental_clarity int,
  ADD COLUMN IF NOT EXISTS physical_state text,
  ADD COLUMN IF NOT EXISTS sleep_hours numeric,
  ADD COLUMN IF NOT EXISTS hydration text,
  ADD COLUMN IF NOT EXISTS daily_intention text,
  ADD COLUMN IF NOT EXISTS readiness_score int,
  ADD COLUMN IF NOT EXISTS day_result numeric,
  ADD COLUMN IF NOT EXISTS trades_count int,
  ADD COLUMN IF NOT EXISTS performance_score int,
  ADD COLUMN IF NOT EXISTS checkout_notes text,
  ADD COLUMN IF NOT EXISTS lockout_until timestamptz,
  ADD COLUMN IF NOT EXISTS lockout_reason text;
