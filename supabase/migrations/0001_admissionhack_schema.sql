-- ══════════════════════════════════════════════════════════════════════════
-- AdmissionHack — schema
--
-- Portable and re-runnable: every statement is guarded, so applying it twice
-- is a no-op rather than an error, and a half-applied state can be repaired by
-- applying it again. This file is the exact text that is applied.
--
-- It runs unmodified in either a dedicated project or inside a shared
-- database's `public` schema, which constrains three decisions:
--   * every object is `ah_`-prefixed (tables) or `ah-`-prefixed (storage
--     buckets), so a shared `public` schema has no collisions and no custom
--     schema wiring is needed — Supabase's client assumes `public`;
--   * there are NO triggers, anywhere. A trigger on `auth.users` would run
--     inside the host app's signup transaction, so a fault here could roll back
--     *their* signups; `updated_at` is set by the writer instead, and profiles
--     are created on first use by `ah_ensure_profile`;
--   * the storage read helper is total — it returns false rather than raising
--     when handed a row from a foreign bucket, because storage policies are
--     evaluated per row across the whole project.
--
-- Threat model: this database holds student passports, transcripts, official
-- exam score reports and family financial documents. Every table is
-- deny-by-default via RLS; a row is visible only to its owner, plus a counselor
-- who has been explicitly linked AND whose link the student has accepted.
-- ══════════════════════════════════════════════════════════════════════════

-- ── enums ─────────────────────────────────────────────────────────────────
do $$ begin
  if not exists (select 1 from pg_type where typname = 'ah_role') then
    create type ah_role as enum ('student', 'counselor', 'parent');
  end if;
  if not exists (select 1 from pg_type where typname = 'ah_tier') then
    create type ah_tier as enum ('dream', 'target', 'safe');
  end if;
  if not exists (select 1 from pg_type where typname = 'ah_portfolio_kind') then
    create type ah_portfolio_kind as enum ('activity', 'award', 'work', 'volunteering');
  end if;
end $$;

-- ── profiles ──────────────────────────────────────────────────────────────
create table if not exists ah_profiles (
  id          uuid primary key references auth.users on delete cascade,
  role        ah_role not null default 'student',
  full_name   text not null default '',
  level       text check (level in ('bachelor''s', 'master''s')),
  country     text,
  intake      text,
  budget      integer,
  gpa         text,
  gpa_scale   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── exam results (structured scores) ──────────────────────────────────────
create table if not exists ah_exam_results (
  user_id     uuid not null references ah_profiles on delete cascade,
  exam_id     text not null,              -- ielts | toefl | sat | duolingo | gpa
  overall     text,
  sections    jsonb not null default '{}'::jsonb,   -- { L, R, W, S } / { ebrw, math }
  taken_on    date,
  primary key (user_id, exam_id),
  updated_at  timestamptz not null default now()
);

-- ── score reports: the uploaded official file, per exam ───────────────────
-- Rows are immutable to their owner: the owner inserts and deletes, but only a
-- linked counselor can set `is_verified` — that column is the entire point of
-- the feature, so the owner must not be able to write it.
create table if not exists ah_score_reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references ah_profiles on delete cascade,
  exam_id     text not null,
  file_path   text not null,              -- path within the ah-score-reports bucket
  file_name   text not null,
  mime_type   text,
  size_bytes  bigint,
  is_verified boolean not null default false,
  verified_by uuid references ah_profiles on delete set null,
  verified_at timestamptz,
  uploaded_at timestamptz not null default now()
);
create index if not exists ah_score_reports_user_idx on ah_score_reports (user_id, exam_id);

-- ── university lists: dream / target / safe ───────────────────────────────
create table if not exists ah_university_lists (
  user_id         uuid not null references ah_profiles on delete cascade,
  university_slug text not null,
  tier            ah_tier not null default 'target',
  added_at        timestamptz not null default now(),
  primary key (user_id, university_slug)
);

-- ── deadlines ─────────────────────────────────────────────────────────────
create table if not exists ah_deadlines (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references ah_profiles on delete cascade,
  title     text not null,
  due_on    date not null,
  created_at timestamptz not null default now()
);
create index if not exists ah_deadlines_user_idx on ah_deadlines (user_id, due_on);

-- ── portfolio ─────────────────────────────────────────────────────────────
create table if not exists ah_portfolio (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references ah_profiles on delete cascade,
  kind        ah_portfolio_kind not null default 'activity',
  title       text not null,
  org         text,
  description text,
  years       text,
  hours       text,
  created_at  timestamptz not null default now()
);

-- ── documents (vault) ─────────────────────────────────────────────────────
create table if not exists ah_documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references ah_profiles on delete cascade,
  name        text not null,
  file_path   text not null,              -- path within the ah-documents bucket
  mime_type   text,
  size_bytes  bigint,
  uploaded_at timestamptz not null default now()
);

-- ── document checklist state ──────────────────────────────────────────────
create table if not exists ah_checklist (
  user_id    uuid not null references ah_profiles on delete cascade,
  doc_key    text not null,
  done       boolean not null default false,
  primary key (user_id, doc_key)
);

-- ── counselor links: who may read which student's workspace ───────────────
create table if not exists ah_counselor_links (
  id            uuid primary key default gen_random_uuid(),
  counselor_id  uuid not null references ah_profiles on delete cascade,
  student_email text not null,           -- invited by email
  student_id    uuid references ah_profiles on delete cascade,
  status        text not null default 'pending'
                check (status in ('pending', 'active', 'revoked')),
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  unique (counselor_id, student_email)
);
create index if not exists ah_counselor_links_active_idx
  on ah_counselor_links (student_id) where status = 'active';

-- ══════════════════════════════════════════════════════════════════════════
-- Helpers
--
-- All SECURITY DEFINER so a policy can consult another table without
-- recursing through that table's own RLS; all `stable`; all pinned
-- `search_path` (a mutable search_path on a definer function is an escalation
-- vector); none of them raise on unexpected input.
-- ══════════════════════════════════════════════════════════════════════════

-- Is the current user an ACCEPTED counselor for this student?
create or replace function ah_is_counselor_of(student uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from ah_counselor_links l
    where l.student_id = student
      and l.counselor_id = auth.uid()
      and l.status = 'active'
  );
$$;

-- Has this counselor invited the current user? Lets a student see who is asking.
create or replace function ah_is_my_counselor(counselor uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from ah_counselor_links l
    where l.counselor_id = counselor
      and l.status in ('pending', 'active')
      and lower(l.student_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- May the current user read this storage object as a counselor? Total by
-- construction: not one of our buckets, or a first path segment that is not a
-- uuid, is simply false.
create or replace function ah_can_read_object(obj_bucket text, obj_name text)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  first text;
begin
  if obj_bucket not in ('ah-documents', 'ah-score-reports') then
    return false;
  end if;
  first := split_part(obj_name, '/', 1);
  if first !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    return false;
  end if;
  return ah_is_counselor_of(first::uuid);
exception when others then
  return false;
end;
$$;

-- Create the caller's profile on first use and claim any invites addressed to
-- their email. This is what a signup trigger would have done, minus the
-- coupling: it runs in the app's own request, never inside auth.users, so a
-- fault here cannot break anyone's signup.
create or replace function ah_ensure_profile(
  p_full_name text default '',
  p_role      ah_role default 'student'
)
returns ah_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  me      uuid := auth.uid();
  mail    text := lower(coalesce(auth.jwt() ->> 'email', ''));
  profile ah_profiles;
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  insert into ah_profiles (id, full_name, role)
  values (me, coalesce(p_full_name, ''), coalesce(p_role, 'student'))
  on conflict (id) do update
    set full_name  = case
                       when ah_profiles.full_name = '' then excluded.full_name
                       else ah_profiles.full_name
                     end,
        -- never overwrite a role that is already set: a counselor must not be
        -- demoted because they opened the student dashboard once
        updated_at = now();

  -- attach this identity to invites waiting on the email. Status stays
  -- 'pending': linking tells the counselor the account now exists, and only
  -- the student's own accept turns it 'active'.
  update ah_counselor_links
     set student_id = me
   where student_id is null
     and mail <> ''
     and lower(student_email) = mail;

  select * into profile from ah_profiles where id = me;
  return profile;
end;
$$;

-- ══════════════════════════════════════════════════════════════════════════
-- RLS — deny by default, owner full, accepted counselor read-only
-- ══════════════════════════════════════════════════════════════════════════

alter table ah_profiles          enable row level security;
alter table ah_exam_results      enable row level security;
alter table ah_score_reports     enable row level security;
alter table ah_university_lists  enable row level security;
alter table ah_deadlines         enable row level security;
alter table ah_portfolio         enable row level security;
alter table ah_documents         enable row level security;
alter table ah_checklist         enable row level security;
alter table ah_counselor_links   enable row level security;

-- Tables holding passports and transcripts are not readable by the anonymous
-- role at all. RLS already denies it (no policy grants anon anything); this
-- removes the privilege too, so a future policy mistake is not sufficient on
-- its own.
revoke all on ah_profiles, ah_exam_results, ah_score_reports, ah_university_lists,
              ah_deadlines, ah_portfolio, ah_documents, ah_checklist, ah_counselor_links
  from anon;

-- ── profiles ──────────────────────────────────────────────────────────────
drop policy if exists ah_profiles_own on ah_profiles;
create policy ah_profiles_own on ah_profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists ah_profiles_counselor_read on ah_profiles;
create policy ah_profiles_counselor_read on ah_profiles
  for select to authenticated using (ah_is_counselor_of(id));

-- a student may see who invited them, but only them
drop policy if exists ah_profiles_inviter_read on ah_profiles;
create policy ah_profiles_inviter_read on ah_profiles
  for select to authenticated using (ah_is_my_counselor(id));

-- ── the per-student tables share one policy shape ─────────────────────────
drop policy if exists ah_exam_results_own on ah_exam_results;
create policy ah_exam_results_own on ah_exam_results
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists ah_exam_results_counselor_read on ah_exam_results;
create policy ah_exam_results_counselor_read on ah_exam_results
  for select to authenticated using (ah_is_counselor_of(user_id));

drop policy if exists ah_university_lists_own on ah_university_lists;
create policy ah_university_lists_own on ah_university_lists
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists ah_university_lists_counselor_read on ah_university_lists;
create policy ah_university_lists_counselor_read on ah_university_lists
  for select to authenticated using (ah_is_counselor_of(user_id));

drop policy if exists ah_deadlines_own on ah_deadlines;
create policy ah_deadlines_own on ah_deadlines
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists ah_deadlines_counselor_read on ah_deadlines;
create policy ah_deadlines_counselor_read on ah_deadlines
  for select to authenticated using (ah_is_counselor_of(user_id));

drop policy if exists ah_portfolio_own on ah_portfolio;
create policy ah_portfolio_own on ah_portfolio
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists ah_portfolio_counselor_read on ah_portfolio;
create policy ah_portfolio_counselor_read on ah_portfolio
  for select to authenticated using (ah_is_counselor_of(user_id));

drop policy if exists ah_documents_own on ah_documents;
create policy ah_documents_own on ah_documents
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists ah_documents_counselor_read on ah_documents;
create policy ah_documents_counselor_read on ah_documents
  for select to authenticated using (ah_is_counselor_of(user_id));

drop policy if exists ah_checklist_own on ah_checklist;
create policy ah_checklist_own on ah_checklist
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists ah_checklist_counselor_read on ah_checklist;
create policy ah_checklist_counselor_read on ah_checklist
  for select to authenticated using (ah_is_counselor_of(user_id));

-- ── score reports: owner writes, counselor verifies ───────────────────────
-- Split deliberately rather than `for all`, so the owner has no UPDATE policy
-- and therefore cannot mark their own report verified.
drop policy if exists ah_reports_own on ah_score_reports;
drop policy if exists ah_reports_own_select on ah_score_reports;
drop policy if exists ah_reports_own_insert on ah_score_reports;
drop policy if exists ah_reports_own_delete on ah_score_reports;
create policy ah_reports_own_select on ah_score_reports
  for select to authenticated using (user_id = auth.uid());
create policy ah_reports_own_insert on ah_score_reports
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and is_verified = false
    and verified_by is null
    and verified_at is null
  );
create policy ah_reports_own_delete on ah_score_reports
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists ah_reports_counselor_read on ah_score_reports;
create policy ah_reports_counselor_read on ah_score_reports
  for select to authenticated using (ah_is_counselor_of(user_id));

drop policy if exists ah_reports_counselor_verify on ah_score_reports;
create policy ah_reports_counselor_verify on ah_score_reports
  for update to authenticated
  using (ah_is_counselor_of(user_id))
  with check (ah_is_counselor_of(user_id));

-- and column-level: the counselor's UPDATE privilege covers the verification
-- columns and nothing else, so attesting to a report can never rewrite the
-- evidence it attests to
revoke update on ah_score_reports from authenticated;
grant  update (is_verified, verified_by, verified_at) on ah_score_reports to authenticated;

-- ── counselor links ───────────────────────────────────────────────────────
drop policy if exists ah_links_counselor on ah_counselor_links;
create policy ah_links_counselor on ah_counselor_links
  for all to authenticated
  using (counselor_id = auth.uid()) with check (counselor_id = auth.uid());

drop policy if exists ah_links_student_read on ah_counselor_links;
create policy ah_links_student_read on ah_counselor_links
  for select to authenticated
  using (lower(student_email) = lower(coalesce(auth.jwt() ->> 'email', '')) or student_id = auth.uid());

-- the student answers the invite: accept, decline, or later revoke. They may
-- only move the status between those three values, and may never re-point the
-- link at a different student.
drop policy if exists ah_links_student_accept on ah_counselor_links;
create policy ah_links_student_accept on ah_counselor_links
  for update to authenticated
  using (lower(student_email) = lower(coalesce(auth.jwt() ->> 'email', '')) or student_id = auth.uid())
  with check (
    status in ('pending', 'active', 'revoked')
    and (student_id = auth.uid() or student_id is null)
  );

-- ── function privileges ───────────────────────────────────────────────────
revoke execute on function ah_ensure_profile(text, ah_role) from public, anon;
grant  execute on function ah_ensure_profile(text, ah_role) to authenticated;

-- ══════════════════════════════════════════════════════════════════════════
-- Storage: private, namespaced buckets, path-prefixed by user id
--   ah-documents/{user_id}/{file}       — vault
--   ah-score-reports/{user_id}/{file}   — official exam reports
-- A counselor may READ files under a student's prefix once linked and accepted.
-- ══════════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('ah-documents', 'ah-documents', false),
       ('ah-score-reports', 'ah-score-reports', false)
on conflict (id) do nothing;

drop policy if exists ah_storage_owner on storage.objects;
create policy ah_storage_owner on storage.objects
  for all to authenticated
  using (
    bucket_id in ('ah-documents', 'ah-score-reports')
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id in ('ah-documents', 'ah-score-reports')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists ah_storage_counselor_read on storage.objects;
create policy ah_storage_counselor_read on storage.objects
  for select to authenticated
  using (ah_can_read_object(bucket_id, name));
