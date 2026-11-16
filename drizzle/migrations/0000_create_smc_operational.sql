CREATE TABLE public.op_settings (
  user_id uuid PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.op_settings TO authenticated;
GRANT ALL ON public.op_settings TO service_role;
ALTER TABLE public.op_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON public.op_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.op_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  trading_date date NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX op_entries_user_kind_idx ON public.op_entries(user_id, kind, trading_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.op_entries TO authenticated;
GRANT ALL ON public.op_entries TO service_role;
ALTER TABLE public.op_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own entries" ON public.op_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);