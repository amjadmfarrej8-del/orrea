CREATE TABLE public.google_sheets_config (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  spreadsheet_id text,
  spreadsheet_title text,
  sheet_name text,
  enabled boolean NOT NULL DEFAULT false,
  enabled_at timestamptz,
  last_sync_at timestamptz,
  last_error text,
  last_test_at timestamptz,
  last_test_ok boolean,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_sheets_config TO authenticated;
GRANT ALL ON public.google_sheets_config TO service_role;
ALTER TABLE public.google_sheets_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sheets config" ON public.google_sheets_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.google_sheets_config (id) VALUES (1);

CREATE TABLE public.google_sheets_sync (
  order_id uuid PRIMARY KEY,
  status text NOT NULL DEFAULT 'pending',
  error text,
  attempts int NOT NULL DEFAULT 0,
  synced_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_sheets_sync TO authenticated;
GRANT ALL ON public.google_sheets_sync TO service_role;
ALTER TABLE public.google_sheets_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage sheets sync" ON public.google_sheets_sync FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));