-- Accounts table
CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_key TEXT NOT NULL,
  name TEXT NOT NULL,
  initial_balance NUMERIC NOT NULL DEFAULT 100,
  current_balance NUMERIC NOT NULL DEFAULT 100,
  daily_loss_limit NUMERIC,
  last_reset_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, account_key)
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own accounts" ON public.accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trades table (unified)
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_key TEXT NOT NULL,
  date TEXT,
  asset TEXT,
  entry_price TEXT,
  exit_price TEXT,
  stop_loss TEXT,
  take_profit TEXT,
  result TEXT,
  result_price TEXT,
  session TEXT,
  notes TEXT,
  is_favorite BOOLEAN DEFAULT false,
  money_result NUMERIC,
  operational JSONB DEFAULT '{}',
  emotional JSONB DEFAULT '{}',
  rational JSONB DEFAULT '{}',
  routine JSONB DEFAULT '{}',
  pre_trade_image TEXT,
  trading_image TEXT,
  post_trade_image TEXT,
  trade_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own trades" ON public.trades FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Analyses table
CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_key TEXT NOT NULL,
  asset TEXT,
  date TEXT,
  timeframe TEXT,
  fibonacci_level TEXT,
  order_block_level TEXT,
  liquidity_zone TEXT,
  notes TEXT,
  status TEXT DEFAULT 'ATIVO',
  image_url1 TEXT,
  image_url2 TEXT,
  image_url3 TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own analyses" ON public.analyses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Daily validations table
CREATE TABLE public.daily_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_key TEXT NOT NULL,
  date TEXT NOT NULL,
  environment BOOLEAN,
  mental_ready TEXT,
  emotional_ready TEXT,
  objective BOOLEAN,
  validated_at TEXT,
  timer_started_at TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, account_key, date)
);

ALTER TABLE public.daily_validations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own validations" ON public.daily_validations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Calculation history table
CREATE TABLE public.calculation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TEXT,
  capital NUMERIC,
  asset TEXT,
  risk_type TEXT,
  stop_loss NUMERIC,
  rr_ratio NUMERIC,
  current_price NUMERIC,
  position_size NUMERIC,
  take_profit_value NUMERIC,
  pips_at_risk NUMERIC,
  pips_potential_profit NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calculation_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own calcs" ON public.calculation_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON public.trades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON public.analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_validations_updated_at BEFORE UPDATE ON public.daily_validations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create default accounts when user signs up
CREATE OR REPLACE FUNCTION public.create_default_accounts()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.accounts (user_id, account_key, name, initial_balance, current_balance)
  VALUES
    (NEW.id, 'conta-pessoal', 'Conta Pessoal', 100, 100),
    (NEW.id, 'conta-financiada', 'Conta Financiada', 50000, 50000),
    (NEW.id, 'conta-challenger', 'Challenger', 100000, 100000);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_accounts();

-- Indexes
CREATE INDEX idx_trades_user_account ON public.trades(user_id, account_key);
CREATE INDEX idx_analyses_user_account ON public.analyses(user_id, account_key);
CREATE INDEX idx_validations_user_date ON public.daily_validations(user_id, account_key, date);