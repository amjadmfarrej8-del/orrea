ALTER TABLE public.products ADD COLUMN IF NOT EXISTS bundle_items jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS free_shipping boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.refresh_bundle_stock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
begin
  update products b set stock = coalesce((
    select min(floor(c.stock / greatest((e->>'quantity')::int,1)))::int
    from jsonb_array_elements(b.bundle_items) e join products c on c.id = (e->>'product_id')::uuid
  ), 0)
  where jsonb_array_length(b.bundle_items) > 0;
  return null;
end $$;

DROP TRIGGER IF EXISTS products_bundle_stock ON public.products;
CREATE TRIGGER products_bundle_stock AFTER INSERT OR UPDATE OF stock, bundle_items ON public.products
FOR EACH STATEMENT WHEN (pg_trigger_depth() < 1) EXECUTE FUNCTION public.refresh_bundle_stock();

CREATE OR REPLACE FUNCTION public.place_order(_customer_name text, _phone text, _email text, _city text, _address text, _notes text, _items jsonb, _coupon text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
declare
  _order_id uuid; _num text; _subtotal numeric := 0; _q jsonb; _item jsonb; _p products%rowtype; _c products%rowtype; _qty int; _cq int; _e jsonb; _ship numeric; _disc numeric; _free boolean := false;
begin
  if length(trim(coalesce(_customer_name,''))) < 2 or length(_customer_name) > 100 then raise exception 'invalid_name'; end if;
  if _phone !~ '^[+0-9 ]{8,20}$' then raise exception 'invalid_phone'; end if;
  if length(trim(coalesce(_city,''))) < 2 or length(_city) > 80 then raise exception 'invalid_city'; end if;
  if length(trim(coalesce(_address,''))) < 5 or length(_address) > 300 then raise exception 'invalid_address'; end if;
  if _email is not null and length(_email) > 255 then raise exception 'invalid_email'; end if;
  if _notes is not null and length(_notes) > 500 then raise exception 'invalid_notes'; end if;
  if jsonb_typeof(_items) <> 'array' or jsonb_array_length(_items) = 0 or jsonb_array_length(_items) > 30 then raise exception 'invalid_items'; end if;

  insert into orders(customer_name, phone, email, city, address, notes, subtotal, shipping, total, user_id)
  values (trim(_customer_name), trim(_phone), nullif(trim(_email),''), trim(_city), trim(_address), nullif(trim(_notes),''), 0, 0, 0, auth.uid())
  returning id, order_number into _order_id, _num;

  for _item in select * from jsonb_array_elements(_items) loop
    _qty := (_item->>'quantity')::int;
    if _qty is null or _qty < 1 or _qty > 20 then raise exception 'invalid_quantity'; end if;
    select * into _p from products where id = (_item->>'product_id')::uuid and is_active for update;
    if not found then raise exception 'product_not_found'; end if;
    if _p.free_shipping then _free := true; end if;
    if jsonb_array_length(_p.bundle_items) > 0 then
      insert into order_items(order_id, product_id, product_name, unit_price, quantity) values (_order_id, _p.id, _p.name_fr, _p.price, _qty);
      for _e in select * from jsonb_array_elements(_p.bundle_items) loop
        _cq := _qty * greatest((_e->>'quantity')::int, 1);
        select * into _c from products where id = (_e->>'product_id')::uuid for update;
        if not found then raise exception 'product_not_found'; end if;
        if _c.stock < _cq then raise exception 'out_of_stock:%', _p.name_fr; end if;
        update products set stock = stock - _cq where id = _c.id;
        insert into order_items(order_id, product_id, product_name, unit_price, quantity) values (_order_id, _c.id, _c.name_fr || ' (pack)', 0, _cq);
      end loop;
    else
      if _p.stock < _qty then raise exception 'out_of_stock:%', _p.name_fr; end if;
      update products set stock = stock - _qty where id = _p.id;
      insert into order_items(order_id, product_id, product_name, unit_price, quantity) values (_order_id, _p.id, _p.name_fr, _p.price, _qty);
    end if;
    _subtotal := _subtotal + _p.price * _qty;
  end loop;

  _q := quote_order(_subtotal, _city, _coupon);
  if _q ? 'error' then raise exception 'invalid_coupon'; end if;
  _ship := case when _free then 0 else (_q->>'shipping')::numeric end;
  _disc := (_q->>'discount')::numeric;
  update orders set subtotal = _subtotal, shipping = _ship, discount = _disc, coupon_code = _q->>'coupon',
    total = _subtotal - _disc + _ship where id = _order_id;
  return jsonb_build_object('order_number', _num, 'total', _subtotal - _disc + _ship);
end $function$;