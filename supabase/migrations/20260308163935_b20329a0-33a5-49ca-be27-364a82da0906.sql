
-- Create withdrawals table
CREATE TABLE public.withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_key TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  capital_at_withdrawal NUMERIC NOT NULL,
  profit_percentage NUMERIC NOT NULL DEFAULT 0,
  proof_url TEXT,
  notes TEXT,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Users manage own withdrawals"
  ON public.withdrawals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_withdrawals_updated_at
  BEFORE UPDATE ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for withdrawal proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('withdrawal-proofs', 'withdrawal-proofs', true);

-- Storage RLS policies
CREATE POLICY "Users upload own withdrawal proofs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'withdrawal-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users view own withdrawal proofs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'withdrawal-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own withdrawal proofs"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'withdrawal-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
