-- Aura Safe production schema for Supabase/Postgres.
-- Run in Supabase SQL Editor. Review the privacy and retention policy before launch.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text not null,
  phone text,
  website text,
  province text,
  address text,
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  verified boolean not null default false,
  active boolean not null default true,
  verification_notes text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.incident_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  description text not null check (char_length(description) between 5 and 10000),
  consent_recorded boolean not null default false check (consent_recorded = true),
  status text not null default 'received' check (status in ('received','reviewing','referred','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.sos_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  source text not null default 'user_button',
  status text not null default 'new' check (status in ('new','reviewing','contacted','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists incident_reports_user_created_idx on public.incident_reports(user_id, created_at desc);
create index if not exists sos_alerts_created_idx on public.sos_alerts(created_at desc);
create index if not exists services_active_idx on public.services(active, name);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, role) values (new.id, coalesce(new.raw_user_meta_data->>'display_name',''), 'user') on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.incident_reports enable row level security;
alter table public.sos_alerts enable row level security;
create or replace function public.is_aura_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin');
$$;
revoke all on function public.is_aura_admin() from public;
grant execute on function public.is_aura_admin() to authenticated;

-- Profiles: users may see/update only their own non-role fields; admins may view profiles if needed.
drop policy if exists "profile self read" on public.profiles;
create policy "profile self read" on public.profiles for select to authenticated using (id = (select auth.uid()) or public.is_aura_admin());
drop policy if exists "profile self update" on public.profiles;
create policy "profile self update" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()) and role = 'user');
-- Public sees only active service listings; only admins can manage records.
drop policy if exists "active services public read" on public.services;
create policy "active services public read" on public.services for select to anon, authenticated using (active = true or public.is_aura_admin());
drop policy if exists "admin manage services" on public.services;
create policy "admin manage services" on public.services for all to authenticated using (public.is_aura_admin()) with check (public.is_aura_admin());
-- Reports and SOS: owner can create and read their own; only admins can read/update all.
drop policy if exists "owner create report" on public.incident_reports;
create policy "owner create report" on public.incident_reports for insert to authenticated with check (user_id = (select auth.uid()) and consent_recorded = true);
drop policy if exists "owner read reports" on public.incident_reports;
create policy "owner read reports" on public.incident_reports for select to authenticated using (user_id = (select auth.uid()) or public.is_aura_admin());
drop policy if exists "admin update reports" on public.incident_reports;
create policy "admin update reports" on public.incident_reports for update to authenticated using (public.is_aura_admin()) with check (public.is_aura_admin());
drop policy if exists "owner create sos" on public.sos_alerts;
create policy "owner create sos" on public.sos_alerts for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "owner read sos" on public.sos_alerts;
create policy "owner read sos" on public.sos_alerts for select to authenticated using (user_id = (select auth.uid()) or public.is_aura_admin());
drop policy if exists "admin update sos" on public.sos_alerts;
create policy "admin update sos" on public.sos_alerts for update to authenticated using (public.is_aura_admin()) with check (public.is_aura_admin());

-- Seed national contacts. Treat these as listed public contacts, not as a fully verified local directory.
insert into public.services (name,category,description,phone,website,province,verified,active)
values
('GBV Command Centre','Crisis counselling','National 24-hour support and counselling for gender-based violence. Confirm the latest contact details on the official government directory.','0800 428 428','https://www.gov.za/about-government/government-call-centres-and-help-lines','National',true,true),
('South African Police Service (SAPS) emergency','Emergency','Police emergency response. Call directly if you are in immediate danger.','10111','https://www.saps.gov.za/','National',true,true),
('Mobile emergency number','Emergency','Mobile-phone emergency number in South Africa.','112','https://www.gov.za/','National',true,true),
('Childline South Africa','Children and young people','Support for children and young people. Check the official site for current options.','116','https://www.childlinesa.org.za/','National',true,true),
('People Opposing Women Abuse (POWA)','Survivor support','Women-focused support and services. Confirm current services, opening hours and access directly.','011 642 4345','https://www.powa.co.za/','Gauteng',false,true)
on conflict do nothing;

-- After creating your own account, promote the intended admin account manually in SQL Editor:
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'YOUR_ADMIN_EMAIL');
