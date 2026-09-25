
create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, full_name text, phone text, email text, created_at timestamptz not null default now());
grant select, insert, update on public.profiles to authenticated; grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all to authenticated using (id=auth.uid()) with check (id=auth.uid());
create policy "admin read profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(),'admin'));
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id, full_name, email) values (new.id, new.raw_user_meta_data->>'full_name', new.email); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.products (
 id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, sku text unique not null,
 category text not null, subcategory text, age_range text not null, brand text not null,
 description text not null default '', specifications jsonb not null default '{}'::jsonb, whats_included text[] not null default '{}',
 keywords text[] not null default '{}', images text[] not null default '{}', emoji text not null default '🧸', color text not null default 'blue',
 price numeric(10,0) not null check (price>=0), sale_price numeric(10,0) check (sale_price is null or sale_price>=0),
 stock_quantity int not null default 0 check (stock_quantity>=0), low_stock_threshold int not null default 5,
 rating numeric(2,1) not null default 4.5, review_count int not null default 0, popularity int not null default 0,
 is_featured boolean not null default false, is_new boolean not null default false, is_best_seller boolean not null default false, is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant select on public.products to anon, authenticated; grant insert, update, delete on public.products to authenticated; grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "public read active" on public.products for select to anon, authenticated using (is_active or public.has_role(auth.uid(),'admin'));
create policy "admin write products" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.store_settings (id int primary key default 1 check (id=1), delivery_fee numeric(10,0) not null default 250, free_delivery_threshold numeric(10,0) default 5000,
 delivery_enabled boolean not null default true, cod_enabled boolean not null default true, cod_stock_policy text not null default 'on_place' check (cod_stock_policy in ('on_place','on_confirm')),
 whatsapp_number text not null default '923000000000', updated_at timestamptz not null default now());
grant select on public.store_settings to anon, authenticated; grant update on public.store_settings to authenticated; grant all on public.store_settings to service_role;
alter table public.store_settings enable row level security;
create policy "read settings" on public.store_settings for select to anon, authenticated using (true);
create policy "admin update settings" on public.store_settings for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.store_settings(id) values (1);

create table public.city_rates (id uuid primary key default gen_random_uuid(), city text unique not null, fee numeric(10,0) not null, available boolean not null default true);
grant select on public.city_rates to anon, authenticated; grant insert, update, delete on public.city_rates to authenticated; grant all on public.city_rates to service_role;
alter table public.city_rates enable row level security;
create policy "read rates" on public.city_rates for select to anon, authenticated using (true);
create policy "admin rates" on public.city_rates for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.city_rates(city, fee) values ('Lahore',200),('Karachi',250),('Islamabad',250),('Rawalpindi',250),('Faisalabad',250),('Multan',300),('Peshawar',300);

create table public.coupons (id uuid primary key default gen_random_uuid(), code text unique not null, discount_type text not null check (discount_type in ('percent','fixed')),
 discount_value numeric(10,2) not null check (discount_value>0), min_order numeric(10,0) not null default 0, max_discount numeric(10,0),
 usage_limit int, used_count int not null default 0, per_customer_limit int, expires_at timestamptz, is_active boolean not null default true,
 assigned_user_id uuid, assigned_email text, assigned_phone text, is_reward boolean not null default false, source_order_id uuid, description text,
 created_at timestamptz not null default now());
grant select, insert, update, delete on public.coupons to authenticated; grant all on public.coupons to service_role;
alter table public.coupons enable row level security;
create policy "admin coupons" on public.coupons for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "own reward coupons" on public.coupons for select to authenticated using (assigned_user_id = auth.uid());
insert into public.coupons(code, discount_type, discount_value, min_order, max_discount, per_customer_limit, description) values ('WELCOME10','percent',10,1500,1000,1,'10% off your first order over Rs 1,500');

create table public.orders (id uuid primary key default gen_random_uuid(), order_number text unique not null, user_id uuid,
 customer_name text not null, phone text not null, email text not null, address text not null, city text not null, postal_code text, notes text,
 subtotal numeric(10,0) not null, delivery_fee numeric(10,0) not null, discount numeric(10,0) not null default 0, total numeric(10,0) not null,
 coupon_code text, payment_method text not null check (payment_method in ('cod','card')),
 payment_status text not null check (payment_status in ('cod_pending','awaiting_payment','paid','failed','cancelled','refunded')),
 payment_provider text, payment_reference text, status text not null default 'placed' check (status in ('pending_payment','placed','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled')),
 stock_deducted boolean not null default false, idempotency_key text unique, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant select on public.orders to authenticated; grant update on public.orders to authenticated; grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "own orders" on public.orders for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin update orders" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.order_items (id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade, product_id uuid references public.products(id) on delete set null,
 product_name text not null, sku text not null, unit_price numeric(10,0) not null, quantity int not null check (quantity>0), line_total numeric(10,0) not null);
grant select on public.order_items to authenticated; grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "own items" on public.order_items for select to authenticated using (exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.has_role(auth.uid(),'admin'))));

create table public.order_status_history (id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade, status text not null, note text, created_at timestamptz not null default now());
grant select on public.order_status_history to authenticated; grant all on public.order_status_history to service_role;
alter table public.order_status_history enable row level security;
create policy "own history" on public.order_status_history for select to authenticated using (exists(select 1 from public.orders o where o.id=order_id and (o.user_id=auth.uid() or public.has_role(auth.uid(),'admin'))));

create table public.coupon_redemptions (id uuid primary key default gen_random_uuid(), coupon_id uuid not null references public.coupons(id) on delete cascade, order_id uuid not null references public.orders(id) on delete cascade, user_id uuid, email text, phone text, created_at timestamptz not null default now());
grant all on public.coupon_redemptions to service_role; grant select on public.coupon_redemptions to authenticated;
alter table public.coupon_redemptions enable row level security;
create policy "admin redemptions" on public.coupon_redemptions for select to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.addresses (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, label text not null default 'Home', full_name text not null, phone text not null, address text not null, city text not null, postal_code text, is_default boolean not null default false, created_at timestamptz not null default now());
grant select, insert, update, delete on public.addresses to authenticated; grant all on public.addresses to service_role;
alter table public.addresses enable row level security;
create policy "own addresses" on public.addresses for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

create table public.wishlists (user_id uuid not null references auth.users(id) on delete cascade, product_id uuid not null references public.products(id) on delete cascade, created_at timestamptz not null default now(), primary key(user_id, product_id));
grant select, insert, delete on public.wishlists to authenticated; grant all on public.wishlists to service_role;
alter table public.wishlists enable row level security;
create policy "own wishlist" on public.wishlists for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

create or replace function public.deduct_order_stock(_order_id uuid) returns boolean language plpgsql security definer set search_path=public as $$
declare r record; begin
 if (select stock_deducted from orders where id=_order_id for update) then return true; end if;
 for r in select product_id, quantity from order_items where order_id=_order_id and product_id is not null loop
   update products set stock_quantity = stock_quantity - r.quantity, popularity = popularity + r.quantity where id=r.product_id and stock_quantity >= r.quantity;
   if not found then raise exception 'OUT_OF_STOCK'; end if;
 end loop;
 update orders set stock_deducted=true where id=_order_id; return true; end $$;
create or replace function public.restore_order_stock(_order_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare r record; begin
 if not (select stock_deducted from orders where id=_order_id for update) then return; end if;
 for r in select product_id, quantity from order_items where order_id=_order_id and product_id is not null loop
   update products set stock_quantity = stock_quantity + r.quantity where id=r.product_id; end loop;
 update orders set stock_deducted=false where id=_order_id; end $$;
revoke all on function public.deduct_order_stock(uuid) from public, anon, authenticated;
revoke all on function public.restore_order_stock(uuid) from public, anon, authenticated;
grant execute on function public.deduct_order_stock(uuid) to service_role;
grant execute on function public.restore_order_stock(uuid) to service_role;

create policy "admin upload product images" on storage.objects for insert to authenticated with check (bucket_id='product-images' and public.has_role(auth.uid(),'admin'));
create policy "admin delete product images" on storage.objects for delete to authenticated using (bucket_id='product-images' and public.has_role(auth.uid(),'admin'));

insert into public.products(slug,name,sku,category,subcategory,age_range,brand,description,specifications,whats_included,keywords,emoji,color,price,sale_price,stock_quantity,rating,review_count,popularity,is_featured,is_new,is_best_seller) values
('cuddly-bunny-plush','Cuddly Bunny Plush','PT-PL-001','Plush Toys','Animals','0-2','SnuggleCo','Super-soft bunny with floppy ears, safe for babies.','{"Size":"30 cm","Material":"Polyester plush","Washable":"Yes"}','{"1 Bunny plush"}','{"bunny","soft toy","baby"}','🐰','pink',1800,1450,24,4.8,126,90,true,false,true),
('rainbow-stacking-rings','Rainbow Stacking Rings','PT-BB-002','Baby & Toddler','Stacking','0-2','TinyHands','Classic wooden stacking rings for colour and size learning.','{"Pieces":"7","Material":"Wood, water-based paint"}','{"7 rings","1 base"}','{"stacking","wooden","montessori"}','🌈','yellow',1500,null,30,4.7,88,70,false,true,false),
('city-builder-blocks-250','City Builder Blocks 250pc','PT-BL-003','Building Sets','Blocks','6-8','BrickTown','250 compatible bricks to build a whole town.','{"Pieces":"250","Material":"ABS plastic"}','{"250 bricks","Idea booklet","Storage box"}','{"lego","bricks","construction"}','🧱','blue',4500,3800,12,4.9,210,120,true,false,true),
('magnetic-tiles-60','Magnetic Tiles 60pc','PT-BL-004','Building Sets','Magnetic','3-5','MagiBuild','Colourful magnetic tiles for 3D building.','{"Pieces":"60","Magnets":"Sealed"}','{"60 tiles","Storage bag"}','{"magnet","stem"}','🔷','lilac',6500,5500,4,4.8,74,85,true,true,false),
('100pc-jungle-puzzle','Jungle Adventure Puzzle 100pc','PT-PZ-005','Puzzles','Jigsaw','6-8','PuzzlePals','A bright jungle jigsaw with chunky pieces.','{"Pieces":"100","Finished size":"40 x 30 cm"}','{"100 pieces","Poster"}','{"jigsaw","animals"}','🧩','peach',1200,null,40,4.5,52,40,false,false,false),
('princess-doll-set','Princess Doll & Wardrobe','PT-DL-006','Dolls','Fashion','3-5','DreamGirl','Doll with 3 outfits and accessories.','{"Height":"28 cm","Outfits":"3"}','{"1 doll","3 outfits","Shoes","Brush"}','{"doll","barbie","princess"}','👸','pink',3200,2700,18,4.6,99,75,false,false,true),
('rc-racing-car','RC Turbo Racing Car','PT-RC-007','Remote Control','Cars','9-12','SpeedX','Rechargeable remote control car, 20 km/h.','{"Speed":"20 km/h","Battery":"Rechargeable","Range":"30 m"}','{"Car","Remote","USB charger"}','{"rc","remote","car"}','🏎️','blue',5500,null,0,4.4,61,60,false,true,false),
('science-lab-kit','Junior Science Lab Kit','PT-ED-008','Educational','STEM','9-12','BrainBox','30 safe experiments for curious minds.','{"Experiments":"30","Age":"8+"}','{"Test tubes","Goggles","Guide book"}','{"science","stem","experiment"}','🔬','lilac',3900,3500,9,4.7,45,55,true,true,false),
('wooden-kitchen-set','Wooden Play Kitchen Set','PT-PR-009','Pretend Play','Kitchen','3-5','TinyHands','Pots, pans and wooden food for little chefs.','{"Pieces":"18","Material":"Wood"}','{"2 pots","1 pan","15 food pieces"}','{"kitchen","pretend","cooking"}','🍳','yellow',4200,null,3,4.6,37,45,false,false,false),
('teddy-bear-xl','Giant Teddy Bear XL','PT-PL-010','Plush Toys','Bears','Teens','SnuggleCo','Huge 90 cm teddy — the perfect gift.','{"Size":"90 cm"}','{"1 Teddy"}','{"teddy","gift","bear"}','🧸','peach',7500,6200,6,4.9,150,95,true,false,true),
('uno-family-cards','Family Card Game','PT-GM-011','Board Games','Cards','6-8','FunTime','Fast family card game for 2-10 players.','{"Players":"2-10","Cards":"112"}','{"112 cards","Rules"}','{"cards","uno","family"}','🃏','blue',900,null,50,4.5,200,110,false,false,true),
('art-craft-box','Mega Art & Craft Box','PT-AC-012','Arts & Crafts','Drawing','6-8','ColorJoy','150-piece art set in a carry case.','{"Pieces":"150"}','{"Crayons","Markers","Paints","Case"}','{"art","drawing","colours"}','🎨','pink',2800,2400,20,4.7,66,65,false,true,false);
