CREATE TABLE public.meta_pixel_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  pixel_id text NOT NULL DEFAULT '' CHECK (pixel_id = '' OR pixel_id ~ '^[0-9]{5,30}$'),
  enabled boolean NOT NULL DEFAULT false CHECK (enabled = false),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.meta_pixel_settings TO authenticated;
GRANT ALL ON public.meta_pixel_settings TO service_role;
ALTER TABLE public.meta_pixel_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read Meta Pixel settings" ON public.meta_pixel_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert Meta Pixel settings" ON public.meta_pixel_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update Meta Pixel settings" ON public.meta_pixel_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
COMMENT ON TABLE public.meta_pixel_settings IS 'Administrator-only Pixel configuration. Tracking cannot be enabled until dataset eligibility and advertising consent implementation are verified.';