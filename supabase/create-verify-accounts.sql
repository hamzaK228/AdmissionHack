-- ══════════════════════════════════════════════════════════════════════════
-- OPTIONAL, and only for testing: two throwaway accounts that
-- supabase/verify-backend.mjs signs in as.
--
-- Paste into the SQL editor of the **sathack** project, after
-- ecosystem-migration.sql. Run it only if the switch script reports that the
-- suite could not pass — the suite needs these two rows to exist in whichever
-- project the app points at.
--
--   student@example.com   / TestPassword123!
--   counselor@example.com / TestPassword123!
--
-- WHY THIS IS SQL AND NOT A SIGNUP: creating them through the app goes through
-- GoTrue's mailer, which rate-limits hard on the default SMTP (429) and leaves
-- the address unconfirmed — so the accounts cannot be signed into on the day you
-- need them. A bare auth.users row is also not enough: password sign-in needs
-- the matching auth.identities row.
--
-- ⚠ THESE ARE REAL, SIGN-INABLE ACCOUNTS WITH A PUBLISHED PASSWORD. Delete them
--   (the final statement) as soon as the suite has run. They are re-creatable in
--   one paste, which is the whole point of this file.
-- ══════════════════════════════════════════════════════════════════════════

-- ── re-runnable: start from a clean slate for exactly these two addresses ───
delete from auth.identities
 where user_id in (select id from auth.users
                    where email in ('student@example.com', 'counselor@example.com'));
delete from auth.users
 where email in ('student@example.com', 'counselor@example.com');

-- ── the accounts ───────────────────────────────────────────────────────────
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated',
   'authenticated', 'student@example.com',
   extensions.crypt('TestPassword123!', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"full_name":"Test Student","role":"student"}'::jsonb,
   now(), now(), '', '', '', ''),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated',
   'authenticated', 'counselor@example.com',
   extensions.crypt('TestPassword123!', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"full_name":"Test Counselor","role":"counselor"}'::jsonb,
   now(), now(), '', '', '', '');

-- ── the identities, without which signInWithPassword returns "invalid login" ─
insert into auth.identities (
  user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
select id, email,
       jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
       'email', now(), now(), now()
  from auth.users
 where email in ('student@example.com', 'counselor@example.com');

-- ── check ──────────────────────────────────────────────────────────────────
select u.email,
       (u.email_confirmed_at is not null) as confirmed,
       (i.user_id is not null)            as has_identity
  from auth.users u
  left join auth.identities i on i.user_id = u.id
 where u.email in ('student@example.com', 'counselor@example.com');

-- ── DELETE THEM WHEN DONE (uncomment and run) ──────────────────────────────
-- delete from auth.identities
--  where user_id in (select id from auth.users
--                     where email in ('student@example.com', 'counselor@example.com'));
-- delete from auth.users
--  where email in ('student@example.com', 'counselor@example.com');
