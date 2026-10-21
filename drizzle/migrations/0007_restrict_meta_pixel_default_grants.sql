REVOKE ALL ON TABLE public.meta_pixel_settings FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.meta_pixel_settings FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.meta_pixel_settings TO authenticated;
GRANT ALL ON TABLE public.meta_pixel_settings TO service_role;