-- Admin broadcast e-mails: one message out to every registered musician, or
-- every registered facility, or both — asked for so news and updates can go
-- out without exporting addresses into some other tool.

-- notifications_log.alert_type is an enum, and every send is logged there, so
-- the type has to exist before anything can be recorded against it.
alter type public.alert_type add value if not exists 'admin_broadcast';

-- Audit trail. A mass e-mail is the one action here that cannot be taken back
-- once it leaves, so what was sent, by whom, to which audience, and how it
-- landed is worth keeping independently of the per-recipient log.
create table if not exists public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  sent_by_user_id uuid not null references public.users(id) on delete restrict,
  -- 'musician' / 'center_coordinator', in the order chosen.
  audiences text[] not null,
  subject text not null,
  body text not null,
  -- Counted at send time: eligible recipients, how many Resend accepted, and
  -- how many it rejected. Kept as stored numbers rather than derived, since
  -- the eligible set changes as people sign up or opt out.
  recipient_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.broadcasts is
  'One row per admin mass e-mail. Audit only — the sending itself happens in the app.';

alter table public.broadcasts enable row level security;

-- Admins only, read and write. Nobody else has any reason to see what was
-- sent to the whole platform.
drop policy if exists broadcasts_admin_select on public.broadcasts;
create policy broadcasts_admin_select on public.broadcasts
  for select using (public.get_my_role() = 'admin');

drop policy if exists broadcasts_admin_insert on public.broadcasts;
create policy broadcasts_admin_insert on public.broadcasts
  for insert with check (public.get_my_role() = 'admin');

grant select, insert on public.broadcasts to authenticated;

create index if not exists broadcasts_created_at_idx on public.broadcasts (created_at desc);
