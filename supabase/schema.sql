-- =========================================================
-- CORECONTROL — Supabase SQL (single file)
-- =========================================================
-- Where: Supabase Dashboard → SQL Editor → New query → paste all → Run
--
-- New project:     run this entire file once.
-- Existing project: run this entire file once (safe to re-run), OR only
--                   section 10 at the bottom if you already have the schema.
-- =========================================================

-- 1. Setup Extensions
create extension if not exists pgcrypto;

-- 2. Create Tenants Table
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  onboarding_completed boolean not null default false,
  created_at timestamptz default now()
);

-- Helper to generate readable IDs (e.g., CUS-1234)
create or replace function public.generate_short_id(prefix text)
returns text language sql as $$
  select prefix || '-' || upper(substring(gen_random_uuid()::text from 1 for 6));
$$;

-- 3. Create Profiles Table (Linked to Tenant)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id),
  role text not null default 'staff' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now()
);

-- 4. Helper to get the current tenant_id (Security Definer to bypass RLS)
create or replace function public.get_auth_tenant_id()
returns uuid language sql stable security definer as $$
  select tenant_id from public.profiles where id = auth.uid();
$$;

-- 5. Business Tables (All with tenant_id)
create table if not exists public.customers (
  id text primary key default public.generate_short_id('CUS'),
  tenant_id uuid references public.tenants(id) not null default public.get_auth_tenant_id(),
  name text,
  phone text not null,
  whatsapp_number text,
  loyalty_points integer default 0,
  visits integer default 0,
  created_at timestamptz not null default now(),
  unique(tenant_id, phone)
);

create table if not exists public.stations (
  id text primary key default public.generate_short_id('STN'),
  tenant_id uuid references public.tenants(id) not null default public.get_auth_tenant_id(),
  name text not null,
  type text not null
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) not null default public.get_auth_tenant_id(),
  kind text not null check (kind in ('booking', 'block')),
  station_id text not null references public.stations(id) on delete restrict,
  station_name text not null,
  date date not null,
  start_time text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  customer_id text references public.customers(id) on update cascade on delete set null,
  customer_name text,
  customer_phone text,
  game_type text,
  controllers integer,
  vr_mode text,
  vr_label text,
  notes text,
  reason text,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create table if not exists public.products (
  id text primary key default public.generate_short_id('PRD'),
  tenant_id uuid references public.tenants(id) not null default public.get_auth_tenant_id(),
  name text not null,
  category text not null,
  mrp integer not null check (mrp >= 0),
  stock_quantity integer not null default 0,
  low_stock_threshold integer not null default 5,
  created_at timestamptz not null default now()
);

create table if not exists public.bills (
  id text primary key default public.generate_short_id('BILL'),
  tenant_id uuid references public.tenants(id) not null default public.get_auth_tenant_id(),
  customer_id text references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  payment_method text not null check (payment_method in ('cash', 'upi', 'card')),
  subtotal integer not null,
  discount integer not null default 0,
  grand_total integer not null,
  points_earned integer not null default 0,
  points_redeemed integer not null default 0,
  items jsonb not null,
  created_at timestamptz not null default now()
);

-- 6. Settings Tables
create table if not exists public.booking_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) not null default public.get_auth_tenant_id() unique,
  opening_time text not null default '10:00',
  closing_time text not null default '23:00',
  slot_minutes integer not null default 15
);

create table if not exists public.pricing_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) not null default public.get_auth_tenant_id() unique,
  config jsonb not null default '{}'::jsonb
);

create table if not exists public.loyalty_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) not null default public.get_auth_tenant_id() unique,
  earn_rate_points integer not null default 5,
  earn_rate_minutes integer not null default 30,
  redeem_rate_points integer not null default 70,
  redeem_rate_minutes integer not null default 60,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- 7. RLS Policies (Tenant Isolation)
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.stations enable row level security;
alter table public.bookings enable row level security;
alter table public.products enable row level security;
alter table public.bills enable row level security;
alter table public.booking_settings enable row level security;
alter table public.pricing_settings enable row level security;
alter table public.loyalty_settings enable row level security;

-- Drop existing policies
drop policy if exists "tenants_isolation" on public.tenants;
drop policy if exists "tenants_update_own" on public.tenants;
drop policy if exists "profiles_select_isolation" on public.profiles;
drop policy if exists "profiles_update_isolation" on public.profiles;
drop policy if exists "customers_isolation" on public.customers;
drop policy if exists "stations_isolation" on public.stations;
drop policy if exists "bookings_isolation" on public.bookings;
drop policy if exists "products_isolation" on public.products;
drop policy if exists "bills_isolation" on public.bills;
drop policy if exists "booking_settings_isolation" on public.booking_settings;
drop policy if exists "pricing_settings_isolation" on public.pricing_settings;
drop policy if exists "loyalty_settings_isolation" on public.loyalty_settings;

-- Simple policy for tenants: Any authenticated user can see names/ids of tenants.
create policy "tenants_isolation" on public.tenants 
for select to authenticated using (true);

create policy "tenants_update_own" on public.tenants
for update to authenticated
using (id = public.get_auth_tenant_id())
with check (id = public.get_auth_tenant_id());

-- Profiles
create policy "profiles_select_isolation" on public.profiles 
for select to authenticated using (auth.uid() = id);

create policy "profiles_update_isolation" on public.profiles 
for update to authenticated using (auth.uid() = id);

-- Sub-tables use the security definer function to check tenant
create policy "customers_isolation" on public.customers for all to authenticated using (tenant_id = public.get_auth_tenant_id()) with check (tenant_id = public.get_auth_tenant_id());
create policy "stations_isolation" on public.stations for all to authenticated using (tenant_id = public.get_auth_tenant_id()) with check (tenant_id = public.get_auth_tenant_id());
create policy "bookings_isolation" on public.bookings for all to authenticated using (tenant_id = public.get_auth_tenant_id()) with check (tenant_id = public.get_auth_tenant_id());
create policy "products_isolation" on public.products for all to authenticated using (tenant_id = public.get_auth_tenant_id()) with check (tenant_id = public.get_auth_tenant_id());
create policy "bills_isolation" on public.bills for all to authenticated using (tenant_id = public.get_auth_tenant_id()) with check (tenant_id = public.get_auth_tenant_id());
create policy "booking_settings_isolation" on public.booking_settings for all to authenticated using (tenant_id = public.get_auth_tenant_id()) with check (tenant_id = public.get_auth_tenant_id());
create policy "pricing_settings_isolation" on public.pricing_settings for all to authenticated using (tenant_id = public.get_auth_tenant_id()) with check (tenant_id = public.get_auth_tenant_id());
create policy "loyalty_settings_isolation" on public.loyalty_settings for all to authenticated using (tenant_id = public.get_auth_tenant_id()) with check (tenant_id = public.get_auth_tenant_id());

-- 8. Automated Onboarding Trigger
create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer as $$
declare
  new_tenant_id uuid;
begin
  -- 1. Create a new Cafe (Tenant)
  insert into public.tenants (name, slug)
  values ('My Gaming Cafe', 'cafe-' || floor(random() * 1000000)::text)
  returning id into new_tenant_id;

  -- 2. Create user profile linked to this cafe
  insert into public.profiles (id, role, tenant_id)
  values (new.id, 'owner', new_tenant_id);

  -- 3. Initialize default settings
  insert into public.booking_settings (tenant_id) values (new_tenant_id);
  insert into public.pricing_settings (tenant_id, config) values (new_tenant_id, '{}'::jsonb);
  insert into public.loyalty_settings (tenant_id) values (new_tenant_id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

-- 9. Atomic Operations
drop function if exists public.decrement_stock(text, integer);
create or replace function public.decrement_stock(product_id text, amount integer)
returns void language plpgsql security definer as $$
begin
  update public.products
  set stock_quantity = greatest(0, stock_quantity - amount)
  where id = product_id
    and tenant_id = public.get_auth_tenant_id();
end;
$$;

drop function if exists public.adjust_loyalty_points(text, integer);
create or replace function public.adjust_loyalty_points(customer_id text, delta integer)
returns void language plpgsql security definer as $$
begin
  update public.customers
  set loyalty_points = greatest(0, loyalty_points + delta),
      visits = visits + 1
  where id = customer_id
    and tenant_id = public.get_auth_tenant_id();
end;
$$;

-- Atomically finalize a bill: create bill record, update stock, and update loyalty
-- Dropping ALL previous variations to clear schema cache definitively
drop function if exists public.finalize_bill(text, text, text, text, integer, integer, integer, integer, integer, jsonb);
drop function if exists public.finalize_bill(text, text, text, text, numeric, numeric, numeric, numeric, numeric, jsonb);
drop function if exists public.finalize_bill(jsonb);
drop function if exists public.finalize_bill_v3(jsonb);
drop function if exists public.atomic_finalize_bill(jsonb);

create or replace function public.atomic_finalize_bill(p_data jsonb)
returns text language plpgsql security definer as $$
declare
  v_bill_id text;
  v_item jsonb;
  v_product_id text;
  v_quantity integer;
  v_tenant_id uuid;
begin
  v_tenant_id := public.get_auth_tenant_id();
  if v_tenant_id is null then
    raise exception 'Not authorized: tenant_id not found for current user';
  end if;

  -- 1. Create the bill
  insert into public.bills (
    tenant_id, customer_id, customer_name, customer_phone,
    payment_method, subtotal, discount, grand_total,
    points_earned, points_redeemed, items
  )
  values (
    v_tenant_id, 
    (p_data->>'p_customer_id'), 
    coalesce(p_data->>'p_customer_name', 'Cash Customer'), 
    (p_data->>'p_customer_phone'),
    coalesce(p_data->>'p_payment_method', 'cash'), 
    coalesce((p_data->>'p_subtotal')::integer, 0), 
    coalesce((p_data->>'p_discount')::integer, 0), 
    coalesce((p_data->>'p_grand_total')::integer, 0),
    coalesce((p_data->>'p_points_earned')::integer, 0), 
    coalesce((p_data->>'p_points_redeemed')::integer, 0), 
    coalesce(p_data->'p_items', '[]'::jsonb)
  )
  returning id into v_bill_id;

  -- 2. Update stock for products
  if p_data->'p_items' is not null and jsonb_array_length(p_data->'p_items') > 0 then
    for v_item in select * from jsonb_array_elements(p_data->'p_items')
    loop
      if (v_item->>'item_type' = 'product' and (v_item->'metadata'->>'product_id') is not null) then
        v_product_id := v_item->'metadata'->>'product_id';
        v_quantity := (v_item->>'quantity')::integer;
        
        update public.products
        set stock_quantity = greatest(0, stock_quantity - v_quantity)
        where id = v_product_id
          and tenant_id = v_tenant_id;
      end if;
    end loop;
  end if;

  -- 3. Update customer loyalty and visits
  if (p_data->>'p_customer_id') is not null then
    update public.customers
    set loyalty_points = greatest(0, loyalty_points + coalesce((p_data->>'p_points_earned')::integer, 0) - coalesce((p_data->>'p_points_redeemed')::integer, 0)),
        visits = visits + 1
    where id = (p_data->>'p_customer_id')
      and tenant_id = v_tenant_id;
  end if;

  return v_bill_id;
end;
$$;

-- 10. Onboarding (column + owner can update tenant + skip for existing cafes)
alter table public.tenants
  add column if not exists onboarding_completed boolean not null default false;

drop policy if exists "tenants_update_own" on public.tenants;

create policy "tenants_update_own" on public.tenants
for update to authenticated
using (id = public.get_auth_tenant_id())
with check (id = public.get_auth_tenant_id());

update public.tenants t
set onboarding_completed = true
where onboarding_completed = false
  and (
    t.name <> 'My Gaming Cafe'
    or exists (select 1 from public.stations s where s.tenant_id = t.id)
  );
