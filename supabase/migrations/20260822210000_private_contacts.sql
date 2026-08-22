-- Personal phone numbers become readable only after the two sides connect.
--
-- The requirement: a musician's or facility's personal/cell number must not be
-- exposed on a public profile before a booking exists between them.
--
-- The display layer already satisfies this — neither the musician profile nor
-- the facility profile renders a number. The gap is the data layer: both
-- `musicians` and `centers` are deliberately readable platform-wide (that is
-- what powers discovery), so any signed-in account could pull the number
-- straight off the API even though nothing on screen showed it.
--
-- An earlier attempt revoked SELECT on the phone column alone. That broke
-- profile completion, because `INSERT ... ON CONFLICT DO UPDATE` — what the
-- onboarding upsert compiles to — requires table-level SELECT, which column
-- grants cannot supply. Column privileges are the wrong instrument anyway:
-- they are role-wide, while the requirement is relative to the row (this
-- viewer, that owner, have they connected).
--
-- So the number moves to its own table, where ordinary row-level RLS can
-- express exactly the intended rule.

-- ---------------------------------------------------------------------------
-- 1. Are these two accounts connected?
-- ---------------------------------------------------------------------------

-- "Connected" means an accepted or completed booking links them. A request
-- that is merely initiated does NOT count: a pending request is one side
-- asking, not an established engagement, and contact details should not fall
-- out of simply sending one.
--
-- security definer because the caller cannot see the counterparty's rows under
-- RLS — which is precisely the set that has to be checked. It returns only a
-- boolean, so it cannot be used to read anything it is shielding.
create or replace function public.users_are_connected(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.requests r
    join public.musicians m on m.id = r.musician_id
    join public.center_locations cl on cl.id = r.center_location_id
    join public.centers c on c.id = cl.center_id
    where r.status in ('accepted', 'completed')
      and (
        (m.user_id = user_a and c.user_id = user_b) or
        (m.user_id = user_b and c.user_id = user_a)
      )
  );
$$;

revoke all on function public.users_are_connected(uuid, uuid) from public;
grant execute on function public.users_are_connected(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. The table
-- ---------------------------------------------------------------------------

create table if not exists public.private_contacts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone text,
  updated_at timestamptz not null default now()
);

comment on table public.private_contacts is
  'Personal contact details, readable only by the owner, an admin, or a counterparty with an accepted/completed booking. Kept out of musicians/centers because those rows are readable platform-wide for discovery.';

alter table public.private_contacts enable row level security;

-- Read: owner, admin, or a connected counterparty.
drop policy if exists private_contacts_select_own on public.private_contacts;
create policy private_contacts_select_own on public.private_contacts
  for select using (user_id = auth.uid());

drop policy if exists private_contacts_select_admin on public.private_contacts;
create policy private_contacts_select_admin on public.private_contacts
  for select using (public.get_my_role() = 'admin');

drop policy if exists private_contacts_select_connected on public.private_contacts;
create policy private_contacts_select_connected on public.private_contacts
  for select using (public.users_are_connected(auth.uid(), user_id));

-- Write: owner only. No admin write policy — an admin has no reason to edit
-- someone's personal number, and not granting it keeps the audit story simple.
drop policy if exists private_contacts_insert_own on public.private_contacts;
create policy private_contacts_insert_own on public.private_contacts
  for insert with check (user_id = auth.uid());

drop policy if exists private_contacts_update_own on public.private_contacts;
create policy private_contacts_update_own on public.private_contacts
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists private_contacts_delete_own on public.private_contacts;
create policy private_contacts_delete_own on public.private_contacts
  for delete using (user_id = auth.uid());

grant select, insert, update, delete on public.private_contacts to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Move the existing numbers across
-- ---------------------------------------------------------------------------

insert into public.private_contacts (user_id, phone)
select m.user_id, m.phone
from public.musicians m
where m.phone is not null and m.phone <> ''
on conflict (user_id) do update set phone = excluded.phone, updated_at = now();

insert into public.private_contacts (user_id, phone)
select c.user_id, c.phone
from public.centers c
where c.phone is not null and c.phone <> ''
  and not exists (select 1 from public.private_contacts p where p.user_id = c.user_id)
on conflict (user_id) do nothing;

-- Clear the originals. The columns stay in place so existing writes do not
-- error; they are simply no longer the source of truth, and the application
-- has been updated to read and write private_contacts instead. Leaving the
-- values behind would defeat the entire point of the move.
update public.musicians set phone = null where phone is not null;
update public.centers set phone = null where phone is not null;
