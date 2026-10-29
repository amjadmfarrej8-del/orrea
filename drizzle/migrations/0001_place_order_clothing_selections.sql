CREATE OR REPLACE FUNCTION public.place_order(_customer_name text, _phone text, _email text, _city text, _address text, _notes text, _items jsonb, _coupon text DEFAULT NULL::text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE
_order_id uuid; _num text; _subtotal numeric := 0; _q jsonb; _item jsonb; _p products%rowtype; _c products%rowtype; _qty int; _cq int; _e jsonb; _ship numeric; _disc numeric; _free boolean := false; _size text; _color text;
BEGIN
IF length(trim(coalesce(_customer_name,''))) < 2 OR length(_customer_name)>100 THEN RAISE EXCEPTION 'invalid_name'; END IF;
IF _phone IS NULL OR _phone !~ '^[+0-9 ]{8,20}$' THEN RAISE EXCEPTION 'invalid_phone'; END IF;
IF length(trim(coalesce(_city,'')))<2 OR length(_city)>80 THEN RAISE EXCEPTION 'invalid_city'; END IF;
IF length(trim(coalesce(_address,'')))<5 OR length(_address)>300 THEN RAISE EXCEPTION 'invalid_address'; END IF;
IF _email IS NOT NULL AND length(_email)>255 THEN RAISE EXCEPTION 'invalid_email'; END IF;
IF _notes IS NOT NULL AND length(_notes)>500 THEN RAISE EXCEPTION 'invalid_notes'; END IF;
IF _items IS NULL OR jsonb_typeof(_items)<>'array' OR jsonb_array_length(_items)=0 OR jsonb_array_length(_items)>30 THEN RAISE EXCEPTION 'invalid_items'; END IF;
INSERT INTO orders(customer_name,phone,email,city,address,notes,subtotal,shipping,total,user_id) VALUES(trim(_customer_name),trim(_phone),nullif(trim(_email),''),trim(_city),trim(_address),nullif(trim(_notes),''),0,0,0,auth.uid()) RETURNING id,order_number INTO _order_id,_num;
FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
_qty:=(_item->>'quantity')::int;
IF _qty IS NULL OR _qty<1 OR _qty>20 THEN RAISE EXCEPTION 'invalid_quantity'; END IF;
SELECT * INTO _p FROM products WHERE id=(_item->>'product_id')::uuid AND is_active FOR UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'product_not_found'; END IF;
IF NOT _p.price_confirmed OR _p.price<=0 THEN RAISE EXCEPTION 'price_unconfirmed'; END IF;
_size:=nullif(trim(_item->>'size'),''); _color:=nullif(trim(_item->>'color'),'');
IF cardinality(_p.sizes)>0 AND (_size IS NULL OR NOT _size=ANY(_p.sizes)) THEN RAISE EXCEPTION 'invalid_size'; END IF;
IF jsonb_array_length(_p.colors)>0 AND (_color IS NULL OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(_p.colors) c WHERE c->>'name'=_color)) THEN RAISE EXCEPTION 'invalid_color'; END IF;
IF length(coalesce(_size,''))>40 OR length(coalesce(_color,''))>60 THEN RAISE EXCEPTION 'invalid_variant'; END IF;
IF _p.free_shipping THEN _free:=true; END IF;
IF jsonb_array_length(_p.bundle_items)>0 THEN
INSERT INTO order_items(order_id,product_id,product_name,unit_price,quantity,selected_size,selected_color) VALUES(_order_id,_p.id,_p.name_fr,_p.price,_qty,_size,_color);
FOR _e IN SELECT * FROM jsonb_array_elements(_p.bundle_items) LOOP
_cq:=_qty*greatest((_e->>'quantity')::int,1);
SELECT * INTO _c FROM products WHERE id=(_e->>'product_id')::uuid FOR UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'product_not_found'; END IF;
IF _c.stock<_cq THEN RAISE EXCEPTION 'out_of_stock:%',_p.name_fr; END IF;
UPDATE products SET stock=stock-_cq WHERE id=_c.id;
INSERT INTO order_items(order_id,product_id,product_name,unit_price,quantity) VALUES(_order_id,_c.id,_c.name_fr||' (pack)',0,_cq);
END LOOP;
ELSE
IF _p.stock<_qty THEN RAISE EXCEPTION 'out_of_stock:%',_p.name_fr; END IF;
UPDATE products SET stock=stock-_qty WHERE id=_p.id;
INSERT INTO order_items(order_id,product_id,product_name,unit_price,quantity,selected_size,selected_color) VALUES(_order_id,_p.id,_p.name_fr,_p.price,_qty,_size,_color);
END IF;
_subtotal:=_subtotal+_p.price*_qty;
END LOOP;
_q:=quote_order(_subtotal,_city,_coupon);
IF _q?'error' THEN RAISE EXCEPTION 'invalid_coupon'; END IF;
_ship:=CASE WHEN _free THEN 0 ELSE (_q->>'shipping')::numeric END; _disc:=(_q->>'discount')::numeric;
UPDATE orders SET subtotal=_subtotal,shipping=_ship,discount=_disc,coupon_code=_q->>'coupon',total=_subtotal-_disc+_ship WHERE id=_order_id;
RETURN jsonb_build_object('order_number',_num,'total',_subtotal-_disc+_ship,'shipping',_ship,'discount',_disc);
END $$;