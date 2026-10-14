-- 0004_community.sql — the student board (Phase 4, the community half).
--
-- Additive, idempotent and `ah_`-prefixed, so it lives safely in the shared
-- ecosystem database beside SAThack's tables, and nothing here goes near
-- auth.users.
--
-- The board is readable by any signed-in student and writable only by an author
-- for their own rows. Author names are stamped onto the row by a trigger rather
-- than joined at read time, for two reasons: ah_profiles is deliberately closed
-- (a student sees their own profile and their linked counselors, and nothing
-- else), and widening that to make a forum convenient would leak the whole
-- profile table; and a client must not be able to post under someone else's name.

create table if not exists public.ah_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.ah_profiles (id) on delete cascade,
  author_name text not null default 'a student',
  topic text not null default 'general'
    check (topic in ('universities', 'exams', 'essays', 'visa', 'scholarships', 'general')),
  title text not null check (char_length(title) between 4 and 160),
  body text not null check (char_length(body) between 1 and 6000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ah_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.ah_posts (id) on delete cascade,
  author_id uuid not null references public.ah_profiles (id) on delete cascade,
  author_name text not null default 'a student',
  body text not null check (char_length(body) between 1 and 3000),
  created_at timestamptz not null default now()
);

create index if not exists ah_posts_created_idx on public.ah_posts (created_at desc);
create index if not exists ah_posts_topic_idx on public.ah_posts (topic);
create index if not exists ah_comments_post_idx on public.ah_comments (post_id, created_at);

-- The author is whoever is signed in, and the name comes from their own profile.
create or replace function public.ah_stamp_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.author_id := auth.uid();
  new.author_name := coalesce(
    (select p.full_name from public.ah_profiles p where p.id = auth.uid()),
    'a student'
  );
  return new;
end;
$$;

drop trigger if exists ah_posts_stamp_author on public.ah_posts;
create trigger ah_posts_stamp_author
  before insert on public.ah_posts
  for each row execute function public.ah_stamp_author();

drop trigger if exists ah_comments_stamp_author on public.ah_comments;
create trigger ah_comments_stamp_author
  before insert on public.ah_comments
  for each row execute function public.ah_stamp_author();

alter table public.ah_posts enable row level security;
alter table public.ah_comments enable row level security;

-- posts — everyone signed in reads the board; only the author writes their row
drop policy if exists ah_posts_read on public.ah_posts;
create policy ah_posts_read on public.ah_posts
  for select to authenticated using (true);

drop policy if exists ah_posts_insert on public.ah_posts;
create policy ah_posts_insert on public.ah_posts
  for insert to authenticated with check (author_id = auth.uid());

drop policy if exists ah_posts_update on public.ah_posts;
create policy ah_posts_update on public.ah_posts
  for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists ah_posts_delete on public.ah_posts;
create policy ah_posts_delete on public.ah_posts
  for delete to authenticated using (author_id = auth.uid());

-- comments — the same shape
drop policy if exists ah_comments_read on public.ah_comments;
create policy ah_comments_read on public.ah_comments
  for select to authenticated using (true);

drop policy if exists ah_comments_insert on public.ah_comments;
create policy ah_comments_insert on public.ah_comments
  for insert to authenticated with check (author_id = auth.uid());

drop policy if exists ah_comments_update on public.ah_comments;
create policy ah_comments_update on public.ah_comments
  for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists ah_comments_delete on public.ah_comments;
create policy ah_comments_delete on public.ah_comments
  for delete to authenticated using (author_id = auth.uid());
