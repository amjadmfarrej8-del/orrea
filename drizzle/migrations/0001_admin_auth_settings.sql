create type public.app_role as enum ('admin', 'customer');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
grant execute on function public.has_role(uuid, app_role) to authenticated, anon;

create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.profiles (
  id uuid primary key,
  full_name text not null default '',
  phone text not null default '',
  email text not null default '',
  city text not null default '',
  address text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "Own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "Own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.email,''));
  insert into public.user_roles (user_id, role) values (new.id, 'customer');
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.products add column sku text not null default '';
alter table public.products add column benefits_fr text not null default '';
alter table public.products add column benefits_ar text not null default '';
alter table public.products add column warnings_fr text not null default '';
alter table public.products add column warnings_ar text not null default '';
alter table public.products add column badge text not null default '';
alter table public.products add column gallery text[] not null default '{}';
alter table public.products add column is_new boolean not null default false;
alter table public.products add column low_stock_threshold int not null default 5;
alter table public.categories add column image text not null default '';
alter table public.categories add column is_active boolean not null default true;

create policy "Admins manage products" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "Admins manage categories" on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
grant insert, update, delete on public.products, public.categories to authenticated;

alter table public.orders add column user_id uuid;
alter table public.orders add column discount numeric(10,2) not null default 0;
alter table public.orders add column coupon_code text;
alter table public.orders alter column status set default 'new';
update public.orders set status = 'new' where status = 'pending';
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
create policy "Read orders" on public.orders for select to authenticated using (public.has_role(auth.uid(),'admin') or user_id = auth.uid());
create policy "Admins update orders" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "Read order items" on public.order_items for select to authenticated using (
  public.has_role(auth.uid(),'admin') or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  kind text not null default 'percent' check (kind in ('percent','fixed')),
  value numeric(10,2) not null check (value > 0),
  min_subtotal numeric(10,2) not null default 0,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.coupons to authenticated;
grant all on public.coupons to service_role;
alter table public.coupons enable row level security;
create policy "Admins manage coupons" on public.coupons for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  city text unique not null,
  fee numeric(10,2) not null check (fee >= 0),
  created_at timestamptz not null default now()
);
grant select on public.shipping_zones to anon, authenticated;
grant insert, update, delete on public.shipping_zones to authenticated;
grant all on public.shipping_zones to service_role;
alter table public.shipping_zones enable row level security;
create policy "Public read zones" on public.shipping_zones for select to anon, authenticated using (true);
create policy "Admins manage zones" on public.shipping_zones for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "Public read settings" on public.site_settings for select to anon, authenticated using (true);
create policy "Admins write settings" on public.site_settings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "Read media" on storage.objects for select using (bucket_id = 'media');
create policy "Admins upload media" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.has_role(auth.uid(),'admin'));
create policy "Admins update media" on storage.objects for update to authenticated using (bucket_id = 'media' and public.has_role(auth.uid(),'admin'));
create policy "Admins delete media" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.has_role(auth.uid(),'admin'));

create or replace function public.quote_order(_subtotal numeric, _city text, _coupon text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare _s jsonb; _fee numeric; _free numeric; _c coupons%rowtype; _disc numeric := 0; _zone numeric; _shipping numeric;
begin
  select value into _s from site_settings where key = 'store';
  _fee := coalesce((_s->>'shipping_fee')::numeric, 35);
  _free := coalesce((_s->>'free_shipping_threshold')::numeric, 500);
  select fee into _zone from shipping_zones where lower(city) = lower(trim(coalesce(_city,'')));
  if _zone is not null then _fee := _zone; end if;
  _shipping := case when _subtotal >= _free then 0 else _fee end;
  if _coupon is not null and length(trim(_coupon)) > 0 then
    select * into _c from coupons where upper(code) = upper(trim(_coupon)) and is_active and (expires_at is null or expires_at > now());
    if found and _subtotal >= _c.min_subtotal then
      _disc := case when _c.kind = 'percent' then round(_subtotal * least(_c.value,100) / 100, 2) else least(_c.value, _subtotal) end;
    else
      return jsonb_build_object('error','invalid_coupon','shipping', _shipping, 'discount', 0);
    end if;
  end if;
  return jsonb_build_object('shipping', _shipping, 'discount', _disc, 'coupon', case when _disc > 0 then upper(trim(_coupon)) end);
end $$;
grant execute on function public.quote_order(numeric, text, text) to anon, authenticated;

drop function public.place_order(text,text,text,text,text,text,jsonb);
create or replace function public.place_order(
  _customer_name text, _phone text, _email text, _city text, _address text, _notes text, _items jsonb, _coupon text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  _order_id uuid; _num text; _subtotal numeric := 0; _q jsonb; _item jsonb; _p products%rowtype; _qty int; _ship numeric; _disc numeric;
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
    if _p.stock < _qty then raise exception 'out_of_stock:%', _p.name_fr; end if;
    update products set stock = stock - _qty where id = _p.id;
    insert into order_items(order_id, product_id, product_name, unit_price, quantity) values (_order_id, _p.id, _p.name_fr, _p.price, _qty);
    _subtotal := _subtotal + _p.price * _qty;
  end loop;

  _q := quote_order(_subtotal, _city, _coupon);
  if _q ? 'error' then raise exception 'invalid_coupon'; end if;
  _ship := (_q->>'shipping')::numeric; _disc := (_q->>'discount')::numeric;
  update orders set subtotal = _subtotal, shipping = _ship, discount = _disc, coupon_code = _q->>'coupon',
    total = _subtotal - _disc + _ship where id = _order_id;
  return jsonb_build_object('order_number', _num, 'total', _subtotal - _disc + _ship);
end $$;
revoke all on function public.place_order(text,text,text,text,text,text,jsonb,text) from public;
grant execute on function public.place_order(text,text,text,text,text,text,jsonb,text) to anon, authenticated;

create or replace function public.track_order(_number text, _phone text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('order_number', o.order_number, 'status', o.status, 'created_at', o.created_at, 'total', o.total,
    'subtotal', o.subtotal, 'shipping', o.shipping, 'discount', o.discount, 'customer_name', o.customer_name, 'city', o.city, 'address', o.address,
    'items', (select coalesce(jsonb_agg(jsonb_build_object('name', i.product_name, 'qty', i.quantity, 'price', i.unit_price)), '[]'::jsonb) from order_items i where i.order_id = o.id))
  from orders o where upper(o.order_number) = upper(trim(_number)) and regexp_replace(o.phone,'[^0-9]','','g') = regexp_replace(coalesce(_phone,''),'[^0-9]','','g')
$$;
grant execute on function public.track_order(text, text) to anon, authenticated;