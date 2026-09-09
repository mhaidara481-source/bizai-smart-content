-- SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  current_period_end timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  provider text,
  provider_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- USAGE
CREATE TABLE public.usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL DEFAULT date_trunc('month', now())::date,
  generations_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_start)
);
GRANT SELECT ON public.usage TO authenticated;
GRANT ALL ON public.usage TO service_role;
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own usage"
  ON public.usage FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- GENERATIONS
CREATE TABLE public.generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool text NOT NULL,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb NOT NULL DEFAULT '{}'::jsonb,
  demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.generations TO authenticated;
GRANT ALL ON public.generations TO service_role;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own generations"
  ON public.generations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX generations_user_created_idx ON public.generations (user_id, created_at DESC);

-- CONTENT CALENDAR
CREATE TABLE public.content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  platform text NOT NULL,
  idea text NOT NULL,
  format text NOT NULL,
  status text NOT NULL DEFAULT 'a_publier',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_calendar TO authenticated;
GRANT ALL ON public.content_calendar TO service_role;
ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own calendar"
  ON public.content_calendar FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX content_calendar_user_date_idx ON public.content_calendar (user_id, entry_date);

-- updated_at triggers
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_usage_updated_at BEFORE UPDATE ON public.usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_content_calendar_updated_at BEFORE UPDATE ON public.content_calendar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();