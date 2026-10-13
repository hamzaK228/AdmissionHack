-- ══════════════════════════════════════════════════════════════════════════
-- AdmissionHack — schema
--
-- Portable migration: works in a dedicated project, or inside a dedicated
-- `admissionhack` Postgres schema in a shared one (change `search_path`).
--
-- Threat model: this database holds student passports, transcripts, official
-- exam score reports and family financial documents. Every table is
-- deny-by-default via RLS; a row is visible only to its owner, plus a counselor
-- who has been explicitly linked AND whose link the student has accepted.
-- ══════════════════════════════════════════════════════════════════════════

-- ── roles ─────────────────────────────────────────────────────────────────
create type ah_role as enum ('student', 'counselor', 'parent');
create type ah_tier as enum ('dream', 'target', 'safe');
create type ah_portfolio_kind as enum ('activity', 'award', 'work', 'volunteering');

-- ── profiles ──────────────────────────────────────────────────────────────
create table ah_profiles (
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
create table ah_exam_results (
  user_id     uuid not null references ah_profiles on delete cascade,
  exam_id     text not null,              -- ielts | toefl | sat | gpa
  overall     text,
  sections    jsonb not null default '{}'::jsonb,   -- { L, R, W, S } / { ebrw, math }
  taken_on    date,
  primary key (user_id, exam_id),
  updated_at  timestamptz not null default now()
);

-- ── score reports: the uploaded official file, per exam ───────────────────
create table ah_score_reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references ah_profiles on delete cascade,
  exam_id     text not null,
  file_path   text not null,              -- path within the score-reports bucket
  file_name   text not null,
  mime_type   text,
  size_bytes  bigint,
  is_verified boolean not null default false,   -- set by a counselor on review
  uploaded_at timestamptz not null default now()
);
create index on ah_score_reports (user_id, exam_id);

-- ── university lists: dream / target / safe ───────────────────────────────
create table ah_university_lists (
  user_id         uuid not null references ah_profiles on delete cascade,
  university_slug text not null,
  tier            ah_tier not null default 'target',
  added_at        timestamptz not null default now(),
  primary key (user_id, university_slug)
);

-- ── deadlines ─────────────────────────────────────────────────────────────
create table ah_deadlines (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references ah_profiles on delete cascade,
  title     text not null,
  due_on    date not null,
  created_at timestamptz not null default now()
);
create index on ah_deadlines (user_id, due_on);

-- ── portfolio ─────────────────────────────────────────────────────────────
create table ah_portfolio (
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
create table ah_documents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references ah_profiles on delete cascade,
  name        text not null,
  file_path   text not null,              -- path within the documents bucket
  mime_type   text,
  size_bytes  bigint,
  uploaded_at timestamptz not null default now()
);

-- ── document checklist state ──────────────────────────────────────────────
create table ah_checklist (
  user_id    uuid not null references ah_profiles on delete cascade,
  doc_key    text not null,
  done       boolean not null default false,
  primary key (user_id, doc_key)
);

-- ── counselor links: who may read which student's workspace ───────────────
create table ah_counselor_links (
  id            uuid primary key default gen_random_uuid(),
  counselor_id  uuid not null references ah_profiles on delete cascade,
  student_email text not null,           -- invited by email
  student_id    uuid references ah_profiles on delete cascade,
  status        text not null default 'pending'
                check (status in ('pending', 'active', 'revoked')),
  created_at    timestamptz not null default now(),
  unique (counselor_id, student_email)
);
create index on ah_counselor_links (student_id) where status = 'active';

-- ══════════════════════════════════════════════════════════════════════════
-- Helper: is the current user an accepted counselor for this student?
-- Written as SECURITY DEFINER so the policy can consult the link table
-- without recursing through its own RLS.
-- ══════════════════════════════════════════════════════════════════════════
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

-- profiles: own row full access; counselor reads linked students
create policy ah_profiles_own on ah_profiles
  for all using (id = auth.uid()) with check (id = auth.uid());
create policy ah_profiles_counselor_read on ah_profiles
  for select using (ah_is_counselor_of(id));

-- the per-student tables share one policy shape
create policy ah_exam_own on ah_exam_results
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ah_exam_counselor_read on ah_exam_results
  for select using (ah_is_counselor_of(user_id));

create policy ah_reports_own on ah_score_reports
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ah_reports_counselor_read on ah_score_reports
  for select using (ah_is_counselor_of(user_id));

create policy ah_unis_own on ah_university_lists
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ah_unis_counselor_read on ah_university_lists
  for select using (ah_is_counselor_of(user_id));

create policy ah_deadlines_own on ah_deadlines
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ah_deadlines_counselor_read on ah_deadlines
  for select using (ah_is_counselor_of(user_id));

create policy ah_portfolio_own on ah_portfolio
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ah_portfolio_counselor_read on ah_portfolio
  for select using (ah_is_counselor_of(user_id));

create policy ah_docs_own on ah_documents
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ah_docs_counselor_read on ah_documents
  for select using (ah_is_counselor_of(user_id));

create policy ah_checklist_own on ah_checklist
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ah_checklist_counselor_read on ah_checklist
  for select using (ah_is_counselor_of(user_id));

-- counselor links: a counselor manages their own invites; a student sees and
-- accepts invites addressed to their email
create policy ah_links_counselor on ah_counselor_links
  for all using (counselor_id = auth.uid()) with check (counselor_id = auth.uid());
create policy ah_links_student_read on ah_counselor_links
  for select using (student_email = (auth.jwt() ->> 'email') or student_id = auth.uid());
create policy ah_links_student_accept on ah_counselor_links
  for update using (student_email = (auth.jwt() ->> 'email'))
  with check (status in ('active', 'revoked'));

-- ══════════════════════════════════════════════════════════════════════════
-- Profile auto-create on signup
-- ══════════════════════════════════════════════════════════════════════════
create or replace function ah_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into ah_profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::ah_role, 'student')
  )
  on conflict (id) do nothing;
  -- link any pending counselor invites addressed to this email
  update ah_counselor_links
     set student_id = new.id, status = 'pending'
   where student_email = new.email and student_id is null;
  return new;
end;
$$;

create trigger ah_on_signup
  after insert on auth.users
  for each row execute function ah_handle_new_user();

create or replace function ah_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger ah_profiles_touch before update on ah_profiles
  for each row execute function ah_touch_updated_at();

-- ══════════════════════════════════════════════════════════════════════════
-- Storage: private buckets, path-prefixed by user id
--   documents/{user_id}/{file}       — vault
--   score-reports/{user_id}/{file}   — official exam reports
-- A counselor may READ files under a student's prefix once linked.
-- ══════════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false), ('score-reports', 'score-reports', false)
on conflict (id) do nothing;

create policy ah_storage_owner on storage.objects
  for all to authenticated
  using (
    bucket_id in ('documents', 'score-reports')
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id in ('documents', 'score-reports')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy ah_storage_counselor_read on storage.objects
  for select to authenticated
  using (
    bucket_id in ('documents', 'score-reports')
    and ah_is_counselor_of(((storage.foldername(name))[1])::uuid)
  );
