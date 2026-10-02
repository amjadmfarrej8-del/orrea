create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_fr text not null,
  name_ar text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Public read categories" on public.categories for select to anon, authenticated using (true);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  category_id uuid references public.categories(id) on delete set null,
  name_fr text not null,
  name_ar text not null,
  tagline_fr text not null default '',
  tagline_ar text not null default '',
  description_fr text not null default '',
  description_ar text not null default '',
  ingredients_fr text not null default '',
  ingredients_ar text not null default '',
  usage_fr text not null default '',
  usage_ar text not null default '',
  size text not null default '',
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2),
  stock int not null default 0 check (stock >= 0),
  image text not null default '',
  is_featured boolean not null default false,
  is_bestseller boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "Public read active products" on public.products for select to anon, authenticated using (is_active);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default ('TH-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  customer_name text not null,
  phone text not null,
  email text,
  city text not null,
  address text not null,
  notes text,
  subtotal numeric(10,2) not null,
  shipping numeric(10,2) not null,
  total numeric(10,2) not null,
  payment_method text not null default 'cod',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
grant all on public.orders to service_role;
alter table public.orders enable row level security;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0)
);
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;

create or replace function public.place_order(
  _customer_name text, _phone text, _email text, _city text, _address text, _notes text, _items jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  _order_id uuid; _num text; _subtotal numeric := 0; _shipping numeric; _item jsonb; _p products%rowtype; _qty int;
begin
  if length(trim(coalesce(_customer_name,''))) < 2 or length(_customer_name) > 100 then raise exception 'invalid_name'; end if;
  if _phone !~ '^[+0-9 ]{8,20}$' then raise exception 'invalid_phone'; end if;
  if length(trim(coalesce(_city,''))) < 2 or length(_city) > 80 then raise exception 'invalid_city'; end if;
  if length(trim(coalesce(_address,''))) < 5 or length(_address) > 300 then raise exception 'invalid_address'; end if;
  if _email is not null and length(_email) > 255 then raise exception 'invalid_email'; end if;
  if _notes is not null and length(_notes) > 500 then raise exception 'invalid_notes'; end if;
  if jsonb_typeof(_items) <> 'array' or jsonb_array_length(_items) = 0 or jsonb_array_length(_items) > 30 then raise exception 'invalid_items'; end if;

  insert into orders(customer_name, phone, email, city, address, notes, subtotal, shipping, total)
  values (trim(_customer_name), trim(_phone), nullif(trim(_email),''), trim(_city), trim(_address), nullif(trim(_notes),''), 0, 0, 0)
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

  _shipping := case when _subtotal >= 500 then 0 else 35 end;
  update orders set subtotal = _subtotal, shipping = _shipping, total = _subtotal + _shipping where id = _order_id;
  return jsonb_build_object('order_number', _num, 'total', _subtotal + _shipping);
end $$;
revoke all on function public.place_order(text,text,text,text,text,text,jsonb) from public;
grant execute on function public.place_order(text,text,text,text,text,text,jsonb) to anon, authenticated;

insert into public.categories (slug, name_fr, name_ar, sort_order) values
('soins-visage','Soins Visage','العناية بالوجه',1),
('serums','Sérums','السيرومات',2),
('corps','Corps','العناية بالجسم',3),
('parfums','Parfums','العطور',4);

insert into public.products (slug, category_id, name_fr, name_ar, tagline_fr, tagline_ar, description_fr, description_ar, ingredients_fr, ingredients_ar, usage_fr, usage_ar, size, price, compare_at_price, stock, image, is_featured, is_bestseller) values
('serum-eclat-vitamine-c',(select id from categories where slug='serums'),'Sérum Éclat Vitamine C','سيروم الإشراقة بفيتامين C','Illumine et unifie le teint','يضيء ويوحد لون البشرة','Un sérum concentré à 15% de vitamine C stabilisée qui ravive l''éclat, atténue les taches et protège des agressions quotidiennes.','سيروم مركز بنسبة 15٪ من فيتامين C المستقر يعيد الإشراقة ويخفف البقع ويحمي من الاعتداءات اليومية.','Vitamine C 15%, acide férulique, vitamine E, eau de rose de Damas.','فيتامين C 15٪، حمض الفيروليك، فيتامين E، ماء الورد الدمشقي.','Appliquer 3 à 4 gouttes le matin sur peau propre, avant la crème.','ضعي 3 إلى 4 قطرات صباحاً على بشرة نظيفة قبل الكريم.','30 ml',420,480,40,'serum',true,true),
('creme-hydratation-absolue',(select id from categories where slug='soins-visage'),'Crème Hydratation Absolue','كريم الترطيب المطلق','Hydratation 72h, texture soyeuse','ترطيب لمدة 72 ساعة بملمس حريري','Une crème fondante à l''acide hyaluronique et à l''huile d''argan bio qui repulpe la peau et restaure sa barrière.','كريم ذائب بحمض الهيالورونيك وزيت الأرغان العضوي يمنح البشرة امتلاءً ويرمم حاجزها.','Acide hyaluronique, huile d''argan bio, céramides, squalane.','حمض الهيالورونيك، زيت الأرغان العضوي، السيراميد، السكوالان.','Masser matin et soir sur le visage et le cou.','دلكي صباحاً ومساءً على الوجه والرقبة.','50 ml',380,null,55,'cream',true,true),
('huile-precieuse-nuit',(select id from categories where slug='soins-visage'),'Huile Précieuse de Nuit','الزيت الثمين الليلي','Régénère pendant le sommeil','يجدد البشرة أثناء النوم','Un élixir de nuit aux huiles de figue de Barbarie et de rose musquée pour une peau reposée et lumineuse au réveil.','إكسير ليلي بزيوت التين الشوكي والورد المسكي لبشرة مرتاحة ومشرقة عند الاستيقاظ.','Huile de figue de Barbarie, rose musquée, bakuchiol.','زيت التين الشوكي، الورد المسكي، باكوشيول.','Chauffer 2 gouttes entre les paumes et presser sur le visage le soir.','سخني قطرتين بين الكفين واضغطي على الوجه مساءً.','30 ml',520,null,25,'oil',true,false),
('nettoyant-doux-micellaire',(select id from categories where slug='soins-visage'),'Gel Nettoyant Doux','جل التنظيف اللطيف','Purifie sans dessécher','ينقي دون تجفيف','Un gel nettoyant au pH physiologique qui élimine impuretés et maquillage en respectant l''équilibre de la peau.','جل منظف بدرجة حموضة فيزيولوجية يزيل الشوائب والمكياج مع احترام توازن البشرة.','Glycérine végétale, aloe vera, extrait de camomille.','الجلسرين النباتي، الصبار، مستخلص البابونج.','Faire mousser sur peau humide, rincer à l''eau tiède.','دلكي على بشرة مبللة واشطفي بالماء الفاتر.','150 ml',220,null,80,'cleanser',false,true),
('lait-corps-ambre',(select id from categories where slug='corps'),'Lait Corps Ambre & Néroli','حليب الجسم بالعنبر والنيرولي','Nourrit et parfume délicatement','يغذي ويعطر برقة','Un lait corporel enveloppant au beurre de karité, parfumé de notes d''ambre doux et de fleur d''oranger.','حليب جسم غني بزبدة الشيا معطر بنفحات العنبر وزهر البرتقال.','Beurre de karité, huile d''amande douce, néroli.','زبدة الشيا، زيت اللوز الحلو، النيرولي.','Appliquer sur l''ensemble du corps après la douche.','ضعيه على كامل الجسم بعد الاستحمام.','200 ml',290,null,60,'body',false,false),
('eau-de-parfum-iris',(select id from categories where slug='parfums'),'Eau de Parfum Iris Blanc','ماء عطر السوسن الأبيض','Poudré, lumineux, intemporel','بودري، مشرق، خالد','Une signature olfactive autour de l''iris de Florence, adoucie de musc blanc et de bois de santal.','توقيع عطري حول سوسن فلورنسا ممزوج بالمسك الأبيض وخشب الصندل.','Iris, musc blanc, santal, bergamote.','السوسن، المسك الأبيض، الصندل، البرغموت.','Vaporiser sur les points de pulsation.','رشي على نقاط النبض.','50 ml',690,null,20,'perfume',true,false);