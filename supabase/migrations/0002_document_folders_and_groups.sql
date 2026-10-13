-- ══════════════════════════════════════════════════════════════════════════
-- AdmissionHack — 0002: document folders and counselor groups
--
-- Two additions, both guarded so this file can be applied on top of 0001 and
-- re-applied safely.
--
--   1. A folder on every document, so a student's workspace has the shape a
--      counselor actually expects: Tests, CV/Essays, Recommendation Letters,
--      College List, Extracurricular Activities, Personal files.
--
--   2. Groups: a counselor creates one and shares a join code; a student enters
--      the code to join. ENTERING THE CODE IS THE CONSENT — the student creates
--      their own membership row, so a group grants a counselor nothing the
--      student did not hand over. That is why there is no INSERT policy on
--      ah_group_members at all: joining happens only through ah_join_group(),
--      which validates the code.
--
-- The visibility rule itself lives in one place. `ah_is_counselor_of()` gains
-- the group case, and because every table policy and the storage read helper
-- already call it, group membership propagates to all nine tables and to files
-- in storage without touching another policy.
-- ══════════════════════════════════════════════════════════════════════════

-- ── folder on documents ───────────────────────────────────────────────────
alter table ah_documents add column if not exists folder text not null default 'personal';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'ah_documents_folder_check') then
    alter table ah_documents add constraint ah_documents_folder_check
      check (folder in ('tests', 'cv-essays', 'recommendation-letters',
                        'college-list', 'extracurriculars', 'personal'));
  end if;
end $$;
create index if not exists ah_documents_folder_idx on ah_documents (user_id, folder);

-- ── groups ────────────────────────────────────────────────────────────────
create table if not exists ah_groups (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references ah_profiles on delete cascade,  -- the counselor
  name       text not null,
  -- short, unambiguous, shareable by voice or chat
  join_code  text not null unique
             default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
  note       text,
  created_at timestamptz not null default now()
);
create index if not exists ah_groups_owner_idx on ah_groups (owner_id);

create table if not exists ah_group_members (
  group_id   uuid not null references ah_groups on delete cascade,
  student_id uuid not null references ah_profiles on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (group_id, student_id)
);
create index if not exists ah_group_members_student_idx on ah_group_members (student_id);

-- ══════════════════════════════════════════════════════════════════════════
-- Helpers
-- ══════════════════════════════════════════════════════════════════════════

create or replace function ah_owns_group(g uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from ah_groups where id = g and owner_id = auth.uid());
$$;

create or replace function ah_is_group_member(g uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from ah_group_members where group_id = g and student_id = auth.uid());
$$;

-- Lets a student see the name of the counselor whose group they joined.
create or replace function ah_is_my_group_owner(counselor uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from ah_groups g
    where g.owner_id = counselor and ah_is_group_member(g.id)
  );
$$;

-- ── the one place visibility is decided ───────────────────────────────────
create or replace function ah_is_counselor_of(student uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  -- an explicitly invited counselor, once the student accepted…
  select exists (
    select 1 from ah_counselor_links l
    where l.student_id = student
      and l.counselor_id = auth.uid()
      and l.status = 'active'
  )
  -- …or a counselor whose group the student joined (joining is the consent)
  or exists (
    select 1
    from ah_group_members m
    join ah_groups g on g.id = m.group_id
    where m.student_id = student
      and g.owner_id = auth.uid()
  );
$$;

-- ── joining ───────────────────────────────────────────────────────────────
-- SECURITY DEFINER so a student can join from a code alone: they never need
-- read access to the group table, so they cannot enumerate groups or codes.
create or replace function ah_join_group(p_code text)
returns ah_groups
language plpgsql
security definer
set search_path = public
as $$
declare
  me    uuid := auth.uid();
  grp   ah_groups;
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  select * into grp from ah_groups where join_code = upper(trim(p_code));
  if grp.id is null then
    raise exception 'no group with that code' using errcode = 'P0002';
  end if;

  insert into ah_group_members (group_id, student_id)
  values (grp.id, me)
  on conflict do nothing;

  return grp;
end;
$$;

revoke execute on function ah_join_group(text) from public, anon;
grant  execute on function ah_join_group(text) to authenticated;

-- ══════════════════════════════════════════════════════════════════════════
-- RLS
-- ══════════════════════════════════════════════════════════════════════════
alter table ah_groups        enable row level security;
alter table ah_group_members enable row level security;

revoke all on ah_groups, ah_group_members from anon;

-- groups: the owner manages it; a member may read the one they joined
drop policy if exists ah_groups_owner on ah_groups;
create policy ah_groups_owner on ah_groups
  for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists ah_groups_member_read on ah_groups;
create policy ah_groups_member_read on ah_groups
  for select to authenticated using (ah_is_group_member(id));

-- members: the owner sees the roster; a student sees and leaves only their own
-- row. No INSERT policy on purpose — joining goes through ah_join_group().
drop policy if exists ah_members_owner_read on ah_group_members;
create policy ah_members_owner_read on ah_group_members
  for select to authenticated using (ah_owns_group(group_id));

drop policy if exists ah_members_self_read on ah_group_members;
create policy ah_members_self_read on ah_group_members
  for select to authenticated using (student_id = auth.uid());

drop policy if exists ah_members_self_leave on ah_group_members;
create policy ah_members_self_leave on ah_group_members
  for delete to authenticated using (student_id = auth.uid());

-- and the corresponding profile read, so a student knows who runs their group
drop policy if exists ah_profiles_group_owner_read on ah_profiles;
create policy ah_profiles_group_owner_read on ah_profiles
  for select to authenticated using (ah_is_my_group_owner(id));
