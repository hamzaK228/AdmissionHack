-- 0007_translations.sql — the translation tracker.
--
-- This product is for international applicants, which means a large share of them
-- hold documents in a language the target university cannot read. A single checklist
-- tick for "sworn/notarised translations" hides the whole problem: which documents,
-- with whom, and how far along each one is. That is the step where seasons are lost,
-- because a translator takes weeks and nobody starts early.
--
-- One row per (student, document). Three states rather than five: `needed` is the
-- honest default, `ordered` means the document is with a translator, and `received`
-- means it is in hand. A state machine that models email threads would be wrong; what
-- a student needs to see is what is still outstanding.
--
-- Additive, idempotent and `ah_`-prefixed like the rest. The vocabulary is a CHECK so
-- the database and the UI cannot drift, the way the document folders work.

create table if not exists public.ah_translations (
  user_id uuid not null references public.ah_profiles (id) on delete cascade,
  doc_key text not null
    check (doc_key in ('transcripts', 'diploma', 'financial', 'passport', 'lor', 'other')),
  state text not null default 'needed'
    check (state in ('needed', 'ordered', 'received')),
  /** the translator or agency, so the student does not have to remember */
  translator text check (translator is null or char_length(translator) <= 200),
  /** apostille, legalisation, cost, lead time — whatever this country demands */
  note text check (note is null or char_length(note) <= 500),
  updated_at timestamptz not null default now(),
  primary key (user_id, doc_key)
);

alter table public.ah_translations enable row level security;

-- the owner: full control over their own rows
drop policy if exists ah_translations_owner on public.ah_translations;
create policy ah_translations_owner on public.ah_translations
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- a counselor reads it, read-only, and only for a student they are linked to. This is
-- not incidental: chasing translations is exactly the kind of unglamorous step a
-- counselor is there to notice, so it has to be visible to them.
drop policy if exists ah_translations_counselor_read on public.ah_translations;
create policy ah_translations_counselor_read on public.ah_translations
  for select to authenticated
  using (public.ah_is_counselor_of(user_id));

comment on table public.ah_translations is
  'Per-document sworn-translation state for an international applicant: needed → ordered → received.';
