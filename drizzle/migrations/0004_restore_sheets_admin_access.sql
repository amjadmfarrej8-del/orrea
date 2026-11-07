GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_sheets_config, public.google_sheets_sync TO authenticated;
GRANT ALL ON public.google_sheets_config, public.google_sheets_sync, public.google_oauth_secrets TO service_role;
ALTER TABLE public.google_sheets_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_sheets_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_oauth_secrets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='google_sheets_config' AND policyname='Sheets administrators manage configuration') THEN
CREATE POLICY "Sheets administrators manage configuration" ON public.google_sheets_config FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
END IF;
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='google_sheets_sync' AND policyname='Sheets administrators manage sync') THEN
CREATE POLICY "Sheets administrators manage sync" ON public.google_sheets_sync FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
END IF;
END $$;
REVOKE ALL ON public.google_oauth_secrets FROM anon, authenticated;