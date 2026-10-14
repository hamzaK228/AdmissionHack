-- 0006_referral_source.sql — where a student heard about us, asked once.
--
-- Deliberately one optional field rather than analytics. To spend money on
-- advertising you have to know what worked, and the privacy policy states as fact
-- that this service runs no analytics, no tracking and no cookies. Asking the
-- student once, in their own words, answers the same question honestly and keeps
-- that promise true — which matters more than the measurement being precise.
--
-- The vocabulary is a CHECK constraint so the database and the UI cannot drift,
-- the same arrangement the document folders use.

alter table public.ah_profiles
  add column if not exists referral_source text
  check (
    referral_source is null
    or referral_source in ('instagram', 'tiktok', 'youtube', 'friend', 'school', 'search', 'other')
  );

comment on column public.ah_profiles.referral_source is
  'Where the student said they heard about the service (optional). Count by channel with: '
  'select referral_source, count(*) from public.ah_profiles group by 1 order by 2 desc;';
