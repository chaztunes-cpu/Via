-- ============================================================
-- Production HQ — database schema (version 1)
--
-- Paste this whole file into Supabase → SQL Editor → New query,
-- then click "Run". It creates three tables:
--   clients          one row per artist/client
--   projects         one row per track; each belongs to one client
--   project_updates  the dated log for each project
-- and locks them so only your signed-in account can see them.
-- ============================================================


-- ---------- Clients ----------
create table public.clients (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users (id) on delete restrict,
  name         text not null check (length(btrim(name)) > 0),
  contact_name text,
  email        text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, owner_id)
);

-- No duplicate clients: "Nova Kade" and " nova  kade " count as the same name.
create unique index clients_one_name_per_owner
  on public.clients (owner_id, lower(regexp_replace(btrim(name), '\s+', ' ', 'g')));


-- ---------- Projects ----------
create table public.projects (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null default auth.uid() references auth.users (id) on delete restrict,
  client_id           uuid not null,
  title               text not null check (length(btrim(title)) > 0),

  service_type        text not null
    check (service_type in ('ghost_production', 'original_production', 'track_finishing', 'remix')),
  status              text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'awaiting_feedback', 'revisions',
                      'ready_for_delivery', 'completed', 'on_hold')),

  -- Deposit and turnaround
  deposit_status      text not null default 'awaiting'
    check (deposit_status in ('awaiting', 'received')),
  deposit_received_on date,
  turnaround_weeks    smallint check (turnaround_weeks between 1 and 52),

  -- Project due date = deposit date + turnaround. The database calculates
  -- it automatically; nobody types it, so it can never be out of sync.
  -- Empty while the deposit is pending or no turnaround is set.
  due_on              date generated always as (
    case when deposit_status = 'received'
         then deposit_received_on + (turnaround_weeks * 7)
    end
  ) stored,

  -- Next action (separate from status) with its own optional deadline
  next_action         text,
  next_action_due_on  date,

  started_at          timestamptz not null default now(),
  completed_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- A received deposit always has a date; a pending one never does.
  constraint deposit_date_matches_status check (
    (deposit_status = 'received' and deposit_received_on is not null) or
    (deposit_status = 'awaiting' and deposit_received_on is null)
  ),
  -- A project can only point at one of your own clients.
  -- Clients that still have projects can't be deleted by accident.
  foreign key (client_id, owner_id) references public.clients (id, owner_id) on delete restrict,
  unique (id, owner_id)
);

create index projects_client_id on public.projects (client_id);
create index projects_owner_due on public.projects (owner_id, due_on);


-- ---------- Project updates (the chronological log) ----------
create table public.project_updates (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete restrict,
  project_id  uuid not null,
  body        text not null check (length(btrim(body)) > 0),
  created_at  timestamptz not null default now(),
  edited_at   timestamptz,
  foreign key (project_id, owner_id) references public.projects (id, owner_id) on delete cascade
);

create index project_updates_by_project on public.project_updates (project_id, created_at desc);


-- ---------- Keep "updated_at" current automatically ----------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger clients_set_updated_at before update on public.clients
  for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();


-- ---------- Security: only your signed-in account can see or change data ----------
alter table public.clients         enable row level security;
alter table public.projects        enable row level security;
alter table public.project_updates enable row level security;

create policy "Owner has full access to their clients"
  on public.clients for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Owner has full access to their projects"
  on public.projects for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Owner has full access to their project updates"
  on public.project_updates for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- Visitors who aren't signed in get no access at all.
revoke all on public.clients, public.projects, public.project_updates from anon;


-- ---------- Live sync between devices ----------
alter publication supabase_realtime
  add table public.clients, public.projects, public.project_updates;
