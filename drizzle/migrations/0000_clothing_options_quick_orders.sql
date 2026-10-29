ALTER TABLE public.products ADD COLUMN sizes text[] NOT NULL DEFAULT '{}', ADD COLUMN colors jsonb NOT NULL DEFAULT '[]', ADD COLUMN price_confirmed boolean NOT NULL DEFAULT true;
ALTER TABLE public.products ADD CONSTRAINT clothing_sizes_limit CHECK (cardinality(sizes) <= 30), ADD CONSTRAINT clothing_colors_array CHECK (jsonb_typeof(colors) = 'array' AND jsonb_array_length(colors) <= 30);
ALTER TABLE public.order_items ADD COLUMN selected_size text, ADD COLUMN selected_color text;
CREATE OR REPLACE FUNCTION public.validate_clothing_order_item() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p public.products%rowtype;
BEGIN
 SELECT * INTO p FROM products WHERE id=NEW.product_id;
 IF FOUND AND NEW.unit_price > 0 THEN
  IF NOT p.price_confirmed OR p.price <= 0 THEN RAISE EXCEPTION 'price_unconfirmed'; END IF;
  IF cardinality(p.sizes)>0 AND (NEW.selected_size IS NULL OR NOT NEW.selected_size=ANY(p.sizes)) THEN RAISE EXCEPTION 'invalid_size'; END IF;
  IF jsonb_array_length(p.colors)>0 AND (NEW.selected_color IS NULL OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p.colors) c WHERE c->>'name'=NEW.selected_color)) THEN RAISE EXCEPTION 'invalid_color'; END IF;
 END IF;
 IF length(coalesce(NEW.selected_size,''))>40 OR length(coalesce(NEW.selected_color,''))>60 THEN RAISE EXCEPTION 'invalid_variant'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_clothing_order_item BEFORE INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.validate_clothing_order_item();