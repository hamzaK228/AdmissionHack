-- ══════════════════════════════════════════════════════════════════════════
-- 0003 — the application tracker: where each application stands
--
-- Paste this into the SQL editor of the **sathack** project (the shared one),
-- like the ecosystem migration before it. Additive and guarded: it adds columns
-- to an existing table, touches no rows, and running it twice is a no-op.
--
-- Why it extends `ah_university_lists` rather than adding a table: that table
-- already holds exactly one row per (student, university), which is the natural
-- key for "where does this application stand". A second table would need the
-- same key and could drift out of step with the tier.
--
-- The RLS policies need no change — the owner policy is `for all` and the
-- counselor policy is a read, so a counselor sees the status as soon as a
-- student sets it, through the same function as everything else.
-- ══════════════════════════════════════════════════════════════════════════

-- `planning` is the honest default: on the list, nothing done yet. Existing
-- rows are backfilled with it, which is exactly what they are.
alter table ah_university_lists add column if not exists status text not null default 'planning';

-- Stamped by the app when the status moves, not typed by the student.
alter table ah_university_lists add column if not exists submitted_on date;
alter table ah_university_lists add column if not exists decided_on date;

-- The vocabulary is enforced in the database, the same way the document folders
-- are: typed text plus a CHECK rather than an enum, so adding a state later is
-- a one-line change here instead of an ALTER TYPE.
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'ah_lists_status_check'
  ) then
    alter table ah_university_lists
      add constraint ah_lists_status_check
      check (status in ('planning', 'preparing', 'submitted', 'waitlisted', 'offer', 'rejected', 'enrolled'));
  end if;
end $$;

-- Deliberately NOT enforced here: that a submission date only exists once
-- submitted, or an outcome date only with an outcome. The app keeps that
-- relationship true, but the workspace sync replaces a student's list with a
-- delete-then-insert — so a cross-column CHECK would turn any client bug into a
-- failed insert *after* the delete, i.e. a silently emptied list. The
-- vocabulary is worth enforcing; that relationship is not worth that risk.

-- ── check it worked ───────────────────────────────────────────────────────
select
  (select count(*) from information_schema.columns
     where table_schema = 'public' and table_name = 'ah_university_lists'
       and column_name in ('status', 'submitted_on', 'decided_on'))            as tracker_columns,
  (select count(*) from pg_constraint where conname in ('ah_lists_status_check')) as status_check,
  (select count(*) from ah_university_lists)                                    as existing_rows_untouched;
