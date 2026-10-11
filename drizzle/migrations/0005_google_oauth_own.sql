ALTER TABLE public.google_sheets_config
  ADD COLUMN oauth_client_id text,
  ADD COLUMN google_email text,
  ADD COLUMN oauth_connected_at timestamptz;

CREATE TABLE public.google_oauth_secrets (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  client_secret_enc text,
  refresh_token_enc text,
  oauth_state text,
  oauth_state_expires timestamptz,
  oauth_redirect_uri text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.google_oauth_secrets TO service_role;
ALTER TABLE public.google_oauth_secrets ENABLE ROW LEVEL SECURITY;
INSERT INTO public.google_oauth_secrets (id) VALUES (1);