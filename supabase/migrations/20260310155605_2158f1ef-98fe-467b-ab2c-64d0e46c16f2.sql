
CREATE TABLE public.custom_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checklist_group TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, checklist_group)
);

ALTER TABLE public.custom_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own checklists"
  ON public.custom_checklists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checklists"
  ON public.custom_checklists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checklists"
  ON public.custom_checklists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checklists"
  ON public.custom_checklists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_custom_checklists_updated_at
  BEFORE UPDATE ON public.custom_checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
