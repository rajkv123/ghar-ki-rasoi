-- Trendgrove Kitchen: catalog, subscriptions, orders, kitchen settings
create table if not exists kitchen_settings (
  id integer primary key check (id = 1),
  kitchen_name text not null,
  tagline text not null,
  address_line text not null,
  city text not null,
  pincode text not null,
  lat double precision not null,
  lng double precision not null,
  phone text not null,
  upi_vpa text not null,
  upi_name text not null,
  licence_number text not null,
  licence_type text not null,
  licence_authority text not null,
  licence_valid_from text not null,
  licence_valid_until text not null,
  licence_image_url text,
  avg_prep_minutes integer not null default 35,
  delivery_radius_km double precision not null default 12,
  default_theme text not null default 'clay',
  about text not null
);

insert into kitchen_settings (
  id, kitchen_name, tagline, address_line, city, pincode, lat, lng, phone,
  upi_vpa, upi_name, licence_number, licence_type, licence_authority,
  licence_valid_from, licence_valid_until, avg_prep_minutes, delivery_radius_km,
  default_theme, about
)
values (
  1,
  'Trendgrove Kitchen',
  'State feasts, cooked at home, delivered warm.',
  '42, 8th F Main, Jayanagar 4th Block',
  'Bengaluru',
  '560041',
  12.9293,
  77.5838,
  '+91 98450 22114',
  'trendgrovekitchen@upi',
  'Trendgrove Kitchen',
  '11225999000123',
  'FSSAI Registration — Petty Food Business (Home Kitchen)',
  'Food Safety and Standards Authority of India',
  '2025-04-12',
  '2026-04-11',
  35,
  12,
  'clay',
  'A residential kitchen cooking daily thalis and weekly a la carte specials from Bihar, Uttar Pradesh, Karnataka, Andhra Pradesh, Kerala and neighbouring tables. Meals leave our home hearth in Jayanagar and arrive with a calorie card and a live delivery trail.'
)
on conflict (id) do nothing;

create table if not exists kitchen_staff (
  user_id text primary key,
  role text not null default 'owner',
  created_at timestamptz not null default now()
);

create table if not exists menu_items (
  id serial primary key,
  name text not null,
  description text not null,
  state_origin text not null,
  flavor text not null,
  category text not null,
  meal_slot text not null default 'lunch',
  price_paise integer not null,
  calories integer not null,
  protein_g integer not null,
  carbs_g integer not null,
  fat_g integer not null,
  is_veg boolean not null default true,
  spice_level integer not null default 2,
  image_url text not null,
  is_available boolean not null default true,
  available_date date,
  is_weekly_special boolean not null default false,
  is_alacarte boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists menu_items_available_idx on menu_items (is_available, available_date);
create index if not exists menu_items_state_idx on menu_items (state_origin);
create index if not exists menu_items_special_idx on menu_items (is_weekly_special);

create table if not exists subscription_plans (
  id serial primary key,
  slug text not null unique,
  name text not null,
  description text not null,
  meals_per_week integer not null,
  price_paise integer not null,
  calories_per_day integer not null,
  serves integer not null default 1,
  perks text not null,
  is_active boolean not null default true
);

insert into subscription_plans (slug, name, description, meals_per_week, price_paise, calories_per_day, serves, perks)
values
  (
    'solo-lunch',
    'Solo Lunch Grove',
    'Five weekday lunches from the daily home board, packed for one.',
    5,
    249900,
    720,
    1,
    'Skip-a-day, calorie card, free delivery under 6 km'
  ),
  (
    'home-table',
    'Home Table',
    'Lunch and dinner for one, six days a week, with one weekly state special.',
    12,
    499900,
    1450,
    1,
    'Weekly special locked in, 10% off a la carte, priority slot'
  ),
  (
    'family-grove',
    'Family Grove',
    'A shared thali for four, six evenings, built for 1,000–2,000 household service.',
    6,
    899900,
    2400,
    4,
    'Family calorie split, two state specials, dedicated delivery window'
  ),
  (
    'weekend-feast',
    'Weekend Feast',
    'Saturday and Sunday a la carte from the rotating state kitchen.',
    2,
    149900,
    890,
    2,
    'Feast-size portions, dessert included, noon delivery'
  )
on conflict (slug) do nothing;

create table if not exists profiles (
  user_id text primary key,
  display_name text,
  phone text,
  address_line text,
  area text,
  city text,
  pincode text,
  lat double precision,
  lng double precision,
  theme text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id serial primary key,
  user_id text not null,
  plan_id integer not null references subscription_plans (id),
  status text not null default 'active',
  started_at timestamptz not null default now(),
  renews_at timestamptz not null,
  last_paid_at timestamptz
);

create index if not exists subscriptions_user_id_idx on subscriptions (user_id);
create index if not exists subscriptions_status_idx on subscriptions (status);

create table if not exists orders (
  id serial primary key,
  user_id text not null,
  status text not null,
  subtotal_paise integer not null,
  delivery_fee_paise integer not null,
  discount_paise integer not null default 0,
  total_paise integer not null,
  total_calories integer not null,
  total_protein_g integer not null,
  total_carbs_g integer not null,
  total_fat_g integer not null,
  delivery_name text not null,
  delivery_phone text not null,
  delivery_address text not null,
  delivery_area text not null,
  delivery_lat double precision not null,
  delivery_lng double precision not null,
  distance_km double precision not null,
  eta_minutes integer not null,
  payment_method text not null,
  payment_ref text,
  paid_at timestamptz,
  preparing_at timestamptz,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on orders (user_id);
create index if not exists orders_status_idx on orders (status);
create index if not exists orders_created_at_idx on orders (created_at desc);

create table if not exists order_items (
  id serial primary key,
  order_id integer not null references orders (id) on delete cascade,
  menu_item_id integer,
  name text not null,
  qty integer not null,
  unit_price_paise integer not null,
  calories integer not null,
  protein_g integer not null,
  carbs_g integer not null,
  fat_g integer not null,
  image_url text not null,
  is_veg boolean not null
);

create index if not exists order_items_order_id_idx on order_items (order_id);
