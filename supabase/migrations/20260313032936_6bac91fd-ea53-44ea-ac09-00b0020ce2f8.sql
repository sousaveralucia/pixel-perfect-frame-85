-- Armazena ticks individuais de checklist por trade
CREATE TABLE IF NOT EXISTS public.trade_checklist_ticks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  account_key TEXT NOT NULL,
  trade_date DATE NOT NULL,
  asset TEXT,
  trade_result TEXT,
  risk_reward NUMERIC,
  checklist_group TEXT NOT NULL,
  item_key TEXT NOT NULL,
  item_label TEXT NOT NULL,
  marked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT trade_checklist_ticks_group_check CHECK (checklist_group IN ('operational', 'emotional', 'routine', 'rational')),
  CONSTRAINT trade_checklist_ticks_unique UNIQUE (trade_id, checklist_group, item_key)
);

ALTER TABLE public.trade_checklist_ticks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own checklist ticks" ON public.trade_checklist_ticks;
CREATE POLICY "Users manage own checklist ticks"
ON public.trade_checklist_ticks
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trade_checklist_ticks_user_date
  ON public.trade_checklist_ticks (user_id, trade_date DESC);

CREATE INDEX IF NOT EXISTS idx_trade_checklist_ticks_trade_id
  ON public.trade_checklist_ticks (trade_id);

DROP TRIGGER IF EXISTS update_trade_checklist_ticks_updated_at ON public.trade_checklist_ticks;
CREATE TRIGGER update_trade_checklist_ticks_updated_at
BEFORE UPDATE ON public.trade_checklist_ticks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Checklist semanal da rotina da comunidade/mentor
CREATE TABLE IF NOT EXISTS public.community_routine_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  watched_daily_close BOOLEAN NOT NULL DEFAULT false,
  compared_markings BOOLEAN NOT NULL DEFAULT false,
  reviewed_opportunities BOOLEAN NOT NULL DEFAULT false,
  watched_week_alignment BOOLEAN NOT NULL DEFAULT false,
  watched_eow BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT community_routine_checks_unique UNIQUE (user_id, week_start)
);

ALTER TABLE public.community_routine_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own community routine checks" ON public.community_routine_checks;
CREATE POLICY "Users manage own community routine checks"
ON public.community_routine_checks
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_community_routine_checks_user_week
  ON public.community_routine_checks (user_id, week_start DESC);

DROP TRIGGER IF EXISTS update_community_routine_checks_updated_at ON public.community_routine_checks;
CREATE TRIGGER update_community_routine_checks_updated_at
BEFORE UPDATE ON public.community_routine_checks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();