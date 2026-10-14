-- 0005_board_moderation.sql — reporting and hiding for the student board.
--
-- Additive and idempotent, `ah_`-prefixed, like the rest.
--
-- The design note worth recording: the author UPDATE policy from 0004 is DROPPED
-- here, deliberately. It existed for a post-editing feature that was never built,
-- and leaving it in place would have made this migration useless — an author whose
-- post the operator hid could simply have set `is_hidden` back to false, because
-- they were allowed to update their own row. Authors keep INSERT and DELETE; only
-- the service role (the operator, in the Supabase SQL editor) can hide anything.
--
-- Hiding is the operator's job rather than a role in the app, because a global
-- board needs a global moderator and inventing an admin role for one action would
-- be a bigger surface than the problem. So: students report, the report is stored,
-- and the operator reads reports and flips the flag.

alter table public.ah_posts add column if not exists is_hidden boolean not null default false;
alter table public.ah_comments add column if not exists is_hidden boolean not null default false;

create index if not exists ah_posts_visible_idx on public.ah_posts (created_at desc) where not is_hidden;

create table if not exists public.ah_post_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.ah_profiles (id) on delete cascade,
  post_id uuid references public.ah_posts (id) on delete cascade,
  comment_id uuid references public.ah_comments (id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  created_at timestamptz not null default now(),
  -- a report is about a post or a comment, never both and never neither
  constraint ah_reports_one_target check ((post_id is null) <> (comment_id is null))
);

create index if not exists ah_post_reports_post_idx on public.ah_post_reports (post_id);
create index if not exists ah_post_reports_created_idx on public.ah_post_reports (created_at desc);

alter table public.ah_post_reports enable row level security;

-- A student files a report as themselves; the reporter cannot be spoofed.
drop policy if exists ah_reports_insert on public.ah_post_reports;
create policy ah_reports_insert on public.ah_post_reports
  for insert to authenticated with check (reporter_id = auth.uid());

-- Reports are not readable through the API by other students — a board where you
-- can see who reported whom is not a board anyone reports on. The operator reads
-- them in the dashboard, where the service role applies.
drop policy if exists ah_reports_read on public.ah_post_reports;
create policy ah_reports_read on public.ah_post_reports
  for select to authenticated using (reporter_id = auth.uid());

-- Close the self-unhide hole: no UPDATE policy at all on either table.
drop policy if exists ah_posts_update on public.ah_posts;
drop policy if exists ah_comments_update on public.ah_comments;

-- Hidden rows disappear for everyone except their author, who still sees their own
-- post — otherwise a hidden post looks like a bug to the person who wrote it.
drop policy if exists ah_posts_read on public.ah_posts;
create policy ah_posts_read on public.ah_posts
  for select to authenticated using (not is_hidden or author_id = auth.uid());

drop policy if exists ah_comments_read on public.ah_comments;
create policy ah_comments_read on public.ah_comments
  for select to authenticated using (not is_hidden or author_id = auth.uid());

comment on table public.ah_post_reports is
  'Student reports on board posts/comments. Hiding is done by the operator: '
  'update public.ah_posts set is_hidden = true where id = ''...'';';
