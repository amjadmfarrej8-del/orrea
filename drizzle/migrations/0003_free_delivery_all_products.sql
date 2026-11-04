-- Store-wide free delivery: 0 MAD on every order, no minimum.
UPDATE public.site_settings SET value = '{"shipping_fee":0,"free_shipping_threshold":0}'::jsonb WHERE key = 'store' AND (value->>'shipping_fee')::numeric <> 0 OR key = 'store' AND (value->>'free_shipping_threshold')::numeric <> 0;

UPDATE public.shipping_zones SET fee = 0 WHERE fee <> 0;

CREATE OR REPLACE FUNCTION public.quote_order(_subtotal numeric, _city text, _coupon text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare _c coupons%rowtype; _disc numeric := 0;
begin
  if _coupon is not null and length(trim(_coupon)) > 0 then
    select * into _c from coupons where upper(code) = upper(trim(_coupon)) and is_active and (expires_at is null or expires_at > now());
    if found and _subtotal >= _c.min_subtotal then
      _disc := case when _c.kind = 'percent' then round(_subtotal * least(_c.value,100) / 100, 2) else least(_c.value, _subtotal) end;
    else
      return jsonb_build_object('error','invalid_coupon','shipping', 0, 'discount', 0);
    end if;
  end if;
  return jsonb_build_object('shipping', 0, 'discount', _disc, 'coupon', case when _disc > 0 then upper(trim(_coupon)) end);
end $function$;

GRANT EXECUTE ON FUNCTION public.quote_order(numeric, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order(text, text, text, text, text, text, jsonb, text) TO anon, authenticated;