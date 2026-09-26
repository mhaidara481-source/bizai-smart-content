CREATE TABLE public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('facebook','instagram')),
  external_id text NOT NULL,
  page_id text NOT NULL,
  name text NOT NULL,
  username text,
  picture_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','revoked')),
  token_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, external_id)
);
GRANT SELECT, DELETE ON public.social_accounts TO authenticated;
GRANT ALL ON public.social_accounts TO service_role;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own social accounts read" ON public.social_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own social accounts delete" ON public.social_accounts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Jetons : accessibles uniquement par le serveur (aucun grant client)
CREATE TABLE public.social_tokens (
  account_id uuid PRIMARY KEY REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  user_access_token text,
  refresh_token text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.social_tokens TO service_role;
ALTER TABLE public.social_tokens ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.social_oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.social_oauth_states TO service_role;
ALTER TABLE public.social_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.social_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.social_accounts(id) ON DELETE SET NULL,
  platform text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','failed')),
  message text,
  image_url text,
  external_post_id text,
  permalink text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.social_publications TO authenticated;
GRANT ALL ON public.social_publications TO service_role;
ALTER TABLE public.social_publications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own publications read" ON public.social_publications FOR SELECT TO authenticated USING (auth.uid() = user_id);