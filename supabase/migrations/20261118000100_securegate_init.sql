-- SecureGate Phase 1 database migration
--
-- Target: a fresh Supabase project (or a project where the previous schema can be
-- reset). This migration intentionally replaces the original permissive schema.
--
-- Apply with one of:
--   * Supabase Dashboard -> SQL Editor -> run this file
--   * supabase db push
--
-- For an existing project with data, review the column changes first. In
-- particular, `flats.resident_id` is no longer the source of truth and
-- `visitors.photo_url` becomes `visitors.photo_path`.
--
-- Security model:
--   * The mobile client has no service-role key.
--   * Roles are assigned only by trusted server-side code.
--   * Visitors are created and transitioned through functions, not direct writes.
--   * Photos are private objects, addressed by society-scoped paths and read
--     through short-lived signed URLs.

create extension if not exists pgcrypto;

-- Refuse to run against the original permissive schema. Applying this file to a
-- database that still has `flats.resident_id` or `visitors.photo_url` would
-- otherwise leave the old tables in place and produce confusing errors.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'flats'
      and column_name = 'resident_id'
  ) or exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'visitors'
      and column_name = 'photo_url'
  ) then
    raise exception
      'Legacy SecureGate schema detected. Create a fresh Supabase project (or reset the public schema after backing up data) before applying this migration.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.societies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  address text not null check (char_length(btrim(address)) between 1 and 240),
  created_at timestamptz not null default now()
);

create table if not exists public.flats (
  id uuid primary key default gen_random_uuid(),
  flat_number text not null check (char_length(btrim(flat_number)) between 1 and 30),
  society_id uuid not null references public.societies(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint flats_society_number_unique unique (society_id, flat_number)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  role text not null default 'resident' check (role in ('admin', 'guard', 'resident')),
  society_id uuid references public.societies(id) on delete set null,
  flat_id uuid references public.flats(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.visitors (
  id uuid primary key default gen_random_uuid(),
  visitor_name text not null check (char_length(btrim(visitor_name)) between 1 and 120),
  visitor_type text not null check (visitor_type in ('guest', 'maid', 'delivery', 'electrician', 'plumber')),
  photo_path text not null check (photo_path <> ''),
  flat_id uuid not null references public.flats(id) on delete cascade,
  society_id uuid not null references public.societies(id) on delete cascade,
  created_by_guard_id uuid not null references public.profiles(id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'entered', 'exited')),
  created_at timestamptz not null default now()
);

create table if not exists public.visitor_status_history (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null references public.visitors(id) on delete cascade,
  previous_status text check (previous_status in ('pending', 'approved', 'rejected', 'entered', 'exited')),
  new_status text not null check (new_status in ('pending', 'approved', 'rejected', 'entered', 'exited')),
  changed_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint visitor_status_changed check (previous_status is null or previous_status <> new_status)
);

create index if not exists idx_flats_society_id on public.flats(society_id);
create index if not exists idx_profiles_society_id on public.profiles(society_id);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_visitors_flat_id on public.visitors(flat_id);
create index if not exists idx_visitors_society_id on public.visitors(society_id);
create index if not exists idx_visitors_status on public.visitors(status);
create index if not exists idx_visitors_created_at on public.visitors(created_at desc);
create index if not exists idx_visitors_guard on public.visitors(created_by_guard_id);
create index if not exists idx_history_visitor_id on public.visitor_status_history(visitor_id);
create index if not exists idx_history_changed_by on public.visitor_status_history(changed_by);

-- ---------------------------------------------------------------------------
-- Trusted helpers
--
-- These functions read only the caller's own profile and are used by RLS
-- policies. Keeping them SECURITY DEFINER avoids recursive profiles policies.
-- ---------------------------------------------------------------------------

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_society_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select society_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_flat_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select flat_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin_of(p_society_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and society_id = p_society_id
  );
$$;

-- A caller may see a visitor when it belongs to their flat, or when the caller
-- is a guard/admin assigned to the visitor's society.
create or replace function public.can_access_visitor(p_visitor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.visitors v
    where v.id = p_visitor_id
      and (
        v.flat_id = public.current_flat_id()
        or (
          public.current_user_role() in ('guard', 'admin')
          and v.society_id = public.current_society_id()
        )
      )
  );
$$;

create or replace function public.can_access_visitor_photo(p_object_name text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.visitors v
    where v.photo_path = p_object_name
      and (
        v.flat_id = public.current_flat_id()
        or (
          public.current_user_role() in ('guard', 'admin')
          and v.society_id = public.current_society_id()
        )
      )
  );
$$;

-- New profiles are always residents. A client-supplied role is deliberately
-- ignored; guards and admins are provisioned by the admin Edge Function.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_full_name text;
begin
  v_full_name := btrim(coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  if char_length(v_full_name) < 2 then
    v_full_name := split_part(coalesce(new.email, 'User'), '@', 1);
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    left(v_full_name, 120),
    'resident'
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Defensive consistency check. The create_visitor function already validates
-- the flat/society pair, but this trigger also protects service-role inserts.
create or replace function public.enforce_visitor_society()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_flat_society_id uuid;
begin
  select society_id into v_flat_society_id
  from public.flats
  where id = new.flat_id;

  if v_flat_society_id is null then
    raise exception 'Flat not found';
  end if;

  if v_flat_society_id <> new.society_id then
    raise exception 'Visitor flat does not belong to the selected society';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_visitor_society_trigger on public.visitors;
create trigger enforce_visitor_society_trigger
  before insert or update of flat_id, society_id on public.visitors
  for each row
  execute function public.enforce_visitor_society();

-- Keep profile membership consistent even when an operator edits it directly in
-- SQL. The Edge Function already validates new accounts; this trigger protects
-- manual bootstrap and service-role changes.
create or replace function public.enforce_profile_flat_society()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_flat_society_id uuid;
begin
  if new.flat_id is null then
    return new;
  end if;

  if new.society_id is null then
    raise exception 'A profile assigned to a flat must also have a society';
  end if;

  select society_id into v_flat_society_id
  from public.flats
  where id = new.flat_id;

  if v_flat_society_id is null or v_flat_society_id <> new.society_id then
    raise exception 'Profile flat does not belong to the selected society';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_profile_flat_society_trigger on public.profiles;
create trigger enforce_profile_flat_society_trigger
  before insert or update of flat_id, society_id on public.profiles
  for each row
  execute function public.enforce_profile_flat_society();

-- ---------------------------------------------------------------------------
-- Visitor API
-- ---------------------------------------------------------------------------

create or replace function public.create_visitor(
  p_visitor_name text,
  p_visitor_type text,
  p_photo_path text,
  p_flat_id uuid
)
returns public.visitors
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles%rowtype;
  v_flat public.flats%rowtype;
  v_visitor public.visitors%rowtype;
begin
  select * into v_profile from public.profiles where id = auth.uid();

  if not found then
    raise exception 'Profile not found';
  end if;

  if v_profile.role <> 'guard' then
    raise exception 'Only guards may create visitor records';
  end if;

  if v_profile.society_id is null then
    raise exception 'Guard is not assigned to a society';
  end if;

  select * into v_flat
  from public.flats
  where id = p_flat_id and society_id = v_profile.society_id;

  if not found then
    raise exception 'Flat not found in your society';
  end if;

  if p_photo_path is null
     or p_photo_path !~ ('^' || v_profile.society_id::text || '/[A-Za-z0-9._-]+$') then
    raise exception 'Photo path must be inside your society folder';
  end if;

  insert into public.visitors (
    visitor_name,
    visitor_type,
    photo_path,
    flat_id,
    society_id,
    created_by_guard_id,
    status
  )
  values (
    btrim(p_visitor_name),
    p_visitor_type,
    p_photo_path,
    p_flat_id,
    v_profile.society_id,
    auth.uid(),
    'pending'
  )
  returning * into v_visitor;

  return v_visitor;
end;
$$;

create or replace function public.update_visitor_status(
  p_visitor_id uuid,
  p_new_status text
)
returns public.visitors
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles%rowtype;
  v_visitor public.visitors%rowtype;
  v_updated public.visitors%rowtype;
begin
  select * into v_profile from public.profiles where id = auth.uid();

  if not found then
    raise exception 'Profile not found';
  end if;

  if v_profile.society_id is null then
    raise exception 'Account is not assigned to a society';
  end if;

  select * into v_visitor
  from public.visitors
  where id = p_visitor_id
  for update;

  if not found then
    raise exception 'Visitor not found';
  end if;

  if v_visitor.society_id <> v_profile.society_id then
    raise exception 'Visitor is outside your society';
  end if;

  if v_profile.role = 'resident' then
    if v_profile.flat_id is null or v_visitor.flat_id <> v_profile.flat_id then
      raise exception 'Visitor is not assigned to your flat';
    end if;

    if v_visitor.status <> 'pending'
       or p_new_status not in ('approved', 'rejected') then
      raise exception 'Residents may only approve or reject pending visitors';
    end if;
  elsif v_profile.role = 'guard' then
    if not (
      (v_visitor.status = 'approved' and p_new_status = 'entered')
      or (v_visitor.status = 'entered' and p_new_status = 'exited')
    ) then
      raise exception 'Guards may only mark approved visitors as entered or entered visitors as exited';
    end if;
  else
    raise exception 'Admins cannot change visitor status from the mobile client';
  end if;

  update public.visitors
  set status = p_new_status
  where id = p_visitor_id
  returning * into v_updated;

  insert into public.visitor_status_history (
    visitor_id,
    previous_status,
    new_status,
    changed_by
  )
  values (
    v_visitor.id,
    v_visitor.status,
    p_new_status,
    auth.uid()
  );

  return v_updated;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.societies enable row level security;
alter table public.flats enable row level security;
alter table public.profiles enable row level security;
alter table public.visitors enable row level security;
alter table public.visitor_status_history enable row level security;

drop policy if exists "Societies are readable by all authenticated users" on public.societies;
drop policy if exists "Societies are insertable by admins only" on public.societies;
drop policy if exists "Societies are updatable by admins only" on public.societies;
drop policy if exists "Societies are deletable by admins only" on public.societies;
drop policy if exists "Members can read their society" on public.societies;
create policy "Members can read their society"
  on public.societies for select
  to authenticated
  using (id = public.current_society_id());

drop policy if exists "Flats are readable by members of the same society" on public.flats;
drop policy if exists "Flats are insertable by admins" on public.flats;
drop policy if exists "Flats are updatable by admins" on public.flats;
drop policy if exists "Flats are deletable by admins" on public.flats;
drop policy if exists "Members can read society flats" on public.flats;
drop policy if exists "Society admins can insert flats" on public.flats;
drop policy if exists "Society admins can update flats" on public.flats;
drop policy if exists "Society admins can delete flats" on public.flats;
create policy "Members can read society flats"
  on public.flats for select
  to authenticated
  using (society_id = public.current_society_id());
create policy "Society admins can insert flats"
  on public.flats for insert
  to authenticated
  with check (
    public.current_user_role() = 'admin'
    and society_id = public.current_society_id()
  );
create policy "Society admins can update flats"
  on public.flats for update
  to authenticated
  using (
    public.current_user_role() = 'admin'
    and society_id = public.current_society_id()
  )
  with check (
    public.current_user_role() = 'admin'
    and society_id = public.current_society_id()
  );
create policy "Society admins can delete flats"
  on public.flats for delete
  to authenticated
  using (
    public.current_user_role() = 'admin'
    and society_id = public.current_society_id()
  );

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Admins can read profiles in their society" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Admins can update any profile" on public.profiles;
drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Admins can read profiles in their society" on public.profiles;
drop policy if exists "Users can update their own profile name" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());
create policy "Admins can read profiles in their society"
  on public.profiles for select
  to authenticated
  using (
    public.current_user_role() = 'admin'
    and society_id = public.current_society_id()
  );
create policy "Users can update their own profile name"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Guards can insert visitors" on public.visitors;
drop policy if exists "Users can view visitors for their flat" on public.visitors;
drop policy if exists "Residents can update visitor status (approve/reject)" on public.visitors;
drop policy if exists "Guards can update visitor entry/exit status" on public.visitors;
drop policy if exists "Authorized users can read visitors" on public.visitors;
create policy "Authorized users can read visitors"
  on public.visitors for select
  to authenticated
  using (
    flat_id = public.current_flat_id()
    or (
      public.current_user_role() in ('guard', 'admin')
      and society_id = public.current_society_id()
    )
  );

drop policy if exists "Authenticated users can insert status history" on public.visitor_status_history;
drop policy if exists "Users can view status history for their visitors" on public.visitor_status_history;
drop policy if exists "Authorized users can read visitor history" on public.visitor_status_history;
create policy "Authorized users can read visitor history"
  on public.visitor_status_history for select
  to authenticated
  using (public.can_access_visitor(visitor_id));

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

revoke all on public.societies from anon, authenticated;
revoke all on public.flats from anon, authenticated;
revoke all on public.profiles from anon, authenticated;
revoke all on public.visitors from anon, authenticated;
revoke all on public.visitor_status_history from anon, authenticated;

grant select on public.societies to authenticated;
grant select, insert, update, delete on public.flats to authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select on public.visitors to authenticated;
grant select on public.visitor_status_history to authenticated;

revoke all on function public.current_user_role() from public, anon;
revoke all on function public.current_society_id() from public, anon;
revoke all on function public.current_flat_id() from public, anon;
revoke all on function public.is_admin_of(uuid) from public, anon;
revoke all on function public.can_access_visitor(uuid) from public, anon;
revoke all on function public.can_access_visitor_photo(text) from public, anon;
revoke all on function public.create_visitor(text, text, text, uuid) from public, anon;
revoke all on function public.update_visitor_status(uuid, text) from public, anon;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_society_id() to authenticated;
grant execute on function public.current_flat_id() to authenticated;
grant execute on function public.is_admin_of(uuid) to authenticated;
grant execute on function public.can_access_visitor(uuid) to authenticated;
grant execute on function public.can_access_visitor_photo(text) to authenticated;
grant execute on function public.create_visitor(text, text, text, uuid) to authenticated;
grant execute on function public.update_visitor_status(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Private visitor-photo storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'visitor-photos',
  'visitor-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated users can upload visitor photos" on storage.objects;
drop policy if exists "Anyone can view visitor photos" on storage.objects;
drop policy if exists "Guards can upload visitor photos" on storage.objects;
drop policy if exists "Authorized users can read visitor photos" on storage.objects;

create policy "Guards can upload visitor photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'visitor-photos'
    and public.current_user_role() = 'guard'
    and (storage.foldername(name))[1] = public.current_society_id()::text
  );

create policy "Authorized users can read visitor photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'visitor-photos'
    and public.can_access_visitor_photo(name)
  );

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.visitors;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Bootstrap (run manually, as the database owner)
-- ---------------------------------------------------------------------------
--
-- 1. Create the first auth user in Supabase Dashboard -> Authentication.
-- 2. Create the society and promote that user:
--
--    insert into public.societies (name, address)
--    values ('Your Society', 'Your address')
--    returning id;
--
--    update public.profiles
--    set role = 'admin', society_id = '<society-uuid>'
--    where email = '<admin-email>';
--
-- 3. Add flats:
--
--    insert into public.flats (flat_number, society_id)
--    values ('A-101', '<society-uuid>'), ('A-102', '<society-uuid>');
--
-- 4. Create guards/residents from the SecureGate admin screen. The
--    `admin-create-user` Edge Function assigns the society and flat.
