ALTER TABLE public.products DROP CONSTRAINT clothing_colors_array;
ALTER TABLE public.products ADD CONSTRAINT clothing_colors_array CHECK (jsonb_typeof(colors) = 'array');