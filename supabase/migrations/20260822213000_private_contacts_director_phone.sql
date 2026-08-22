-- Second number for facility accounts.
--
-- A facility record carries two numbers: the facility's own line
-- (centers.phone, mirrored onto center_locations.phone) and the director's
-- personal number (centers.director_phone). The first migration moved the
-- facility line into private_contacts; this moves the director's number,
-- which is the more sensitive of the two — it is a named individual's direct
-- contact, and it sat on a row every signed-in account can read.
--
-- Kept as a second column rather than a second row so a facility's contact
-- details stay one lookup, and so the RLS policies already in place cover it
-- without change.

alter table public.private_contacts
  add column if not exists director_phone text;

comment on column public.private_contacts.director_phone is
  'Facility director''s direct number. Same visibility rule as phone: owner, admin, or a counterparty with an accepted/completed booking.';

-- Move the existing values across, then clear the originals. Facility rows
-- that have no private_contacts row yet get one.
insert into public.private_contacts (user_id, director_phone)
select c.user_id, c.director_phone
from public.centers c
where c.director_phone is not null and c.director_phone <> ''
on conflict (user_id) do update set director_phone = excluded.director_phone, updated_at = now();

update public.centers set director_phone = null where director_phone is not null;

-- center_locations.phone duplicates the facility line that already moved in
-- the previous migration, so it is cleared here too. Leaving the duplicate
-- behind would keep the number readable through a different table and undo
-- the point of the move.
update public.center_locations set phone = null where phone is not null;
