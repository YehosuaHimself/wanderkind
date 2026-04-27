-- ============================================================
-- SHUFFLE REQUESTS — Wanderkind personal booking agent
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================
-- A walker taps SHUFFLE → row inserted here with their profile
-- snapshot + location. Nearby WanderHosts see it in their
-- hosting/requests screen and can accept. First accept sets
-- status = 'matched'. Walker gets a realtime confirmation card.
-- ============================================================

create table if not exists public.shuffle_requests (
  id                 uuid        primary key default gen_random_uuid(),
  requester_id       uuid        not null references auth.users(id) on delete cascade,

  -- Denormalized requester snapshot (hosts see this without a join)
  trail_name         text        not null default '',
  nights_walked      integer     not null default 0,
  tier               text        not null default 'wanderkind',
  bio                text,
  avatar_url         text,

  -- Location at time of request (null = no geolocation available)
  lat                double precision,
  lng                double precision,
  radius_km          integer     not null default 15,

  -- Lifecycle: pending -> matched | expired | cancelled
  status             text        not null default 'pending'
    check (status in ('pending', 'matched', 'expired', 'cancelled')),

  -- Filled by the accepting host
  matched_host_id    uuid        references public.hosts(id),
  matched_profile_id uuid        references public.profiles(id),
  matched_host_name  text,
  matched_at         timestamptz,

  expires_at         timestamptz not null default (now() + interval '24 hours'),
  created_at         timestamptz not null default now()
);

-- Row-level security
alter table public.shuffle_requests enable row level security;

-- Requester: full control over their own rows
create policy "shuffle_requester_all"
  on public.shuffle_requests
  for all
  using  (auth.uid() = requester_id)
  with check (auth.uid() = requester_id);

-- Any authenticated user (WanderHost) can read pending non-expired
-- requests from other users
create policy "shuffle_host_read_pending"
  on public.shuffle_requests
  for select
  to authenticated
  using (
    status        = 'pending'
    and expires_at  > now()
    and requester_id != auth.uid()
  );

-- A host can accept a request (flip status to matched)
-- They must set matched_profile_id = their own uid
create policy "shuffle_host_accept"
  on public.shuffle_requests
  for update
  to authenticated
  using (
    status        = 'pending'
    and expires_at  > now()
    and requester_id != auth.uid()
  )
  with check (
    status              = 'matched'
    and matched_profile_id = auth.uid()
  );

-- Realtime: walker's screen gets instant push when a host accepts
alter publication supabase_realtime add table public.shuffle_requests;
