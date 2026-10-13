#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Switch AdmissionHack onto the SAThack Supabase project, so both products share
# ONE account pool: sign in to either, and you are signed in to both.
#
# Run this ONLY after supabase/ecosystem-migration.sql has been applied to that
# project. Step 1 checks, and refuses to continue if the tables are not there —
# switching early would leave the live site with accounts, sync and documents that
# all fail, which is worse than not switching at all.
#
#   ./scripts/switch-to-ecosystem.sh
#
# Reversible: the old config is copied to .env.local.pre-ecosystem, and the old
# project is left paused (not deleted) so the switch can be undone by restoring
# that file and redeploying.
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")/.."

SATHACK_ENV="../SAThack/SAThack/.env.local"
VERCEL="npx --yes vercel@latest"

if [ ! -f "$SATHACK_ENV" ]; then
  echo "! cannot read the SAThack env at $SATHACK_ENV"
  echo "  (it holds the target project's URL and publishable key)"
  exit 1
fi

URL=$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' "$SATHACK_ENV" | head -1 | cut -d= -f2-)
KEY=$(grep -E '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' "$SATHACK_ENV" | head -1 | cut -d= -f2-)

if [ -z "$URL" ] || [ -z "$KEY" ]; then
  echo "! the SAThack env is missing NEXT_PUBLIC_SUPABASE_URL or _ANON_KEY"
  exit 1
fi

echo "> target project: $URL"
echo

# ── 1. the tables must already be there ──────────────────────────────────────
echo "> 1/5  checking the ah_ tables exist in that project"
CODE=$(curl -s -o /dev/null -w '%{http_code}' \
  "$URL/rest/v1/ah_profiles?select=id&limit=1" -H "apikey: $KEY")

if [ "$CODE" = "404" ]; then
  echo "       ah_profiles is NOT there yet."
  echo
  echo "  Apply supabase/ecosystem-migration.sql to the sathack project first:"
  echo "    Supabase dashboard → the sathack project → SQL editor → paste that file → Run"
  echo "  Then run this script again. Nothing has been changed."
  exit 1
fi
echo "       ok (http $CODE — the table exists; anon still reads nothing, as designed)"
echo

# ── 2. keep the current config, so the switch can be undone ──────────────────
echo "> 2/5  backing up .env.local → .env.local.pre-ecosystem"
cp .env.local .env.local.pre-ecosystem
echo

# ── 3. point this app at the shared project ──────────────────────────────────
echo "> 3/5  pointing .env.local at the shared project"
awk -v u="$URL" -v k="$KEY" '
  /^NEXT_PUBLIC_SUPABASE_URL=/     { print "NEXT_PUBLIC_SUPABASE_URL=" u; next }
  /^NEXT_PUBLIC_SUPABASE_ANON_KEY=/{ print "NEXT_PUBLIC_SUPABASE_ANON_KEY=" k; next }
  { print }
' .env.local > .env.local.tmp
mv .env.local.tmp .env.local
grep -cE '^NEXT_PUBLIC_SUPABASE_(URL|ANON_KEY)=.+' .env.local | xargs -I{} echo "       {} of 2 values set"
echo

# ── 4. the deployed build needs the same values (they are inlined at build) ──
echo "> 4/5  updating the Vercel project (production + preview)"
for target in production preview; do
  printf '%s' "$URL" | $VERCEL env add NEXT_PUBLIC_SUPABASE_URL "$target" --force >/dev/null
  printf '%s' "$KEY" | $VERCEL env add NEXT_PUBLIC_SUPABASE_ANON_KEY "$target" --force >/dev/null
  echo "       $target updated"
done
echo

# ── 5. rebuild, deploy, and try to prove it ──────────────────────────────────
echo "> 5/5  rebuilding and deploying"
npm run build >/dev/null
$VERCEL --prod 2>&1 | grep -E "Production|Ready|Error" | tail -3
echo

echo "> verification"
if node supabase/verify-backend.mjs; then
  echo "  the consent model still holds against the shared project"
else
  echo "  ⚠ the suite could not pass. Expected if its two test accounts do not exist"
  echo "    in the shared project yet — paste supabase/create-verify-accounts.sql into"
  echo "    that project's SQL editor, re-run the suite, then delete them with the"
  echo "    statement at the end of that same file."
fi

cat <<'DONE'

──────────────────────────────────────────────────────────────────────────────
Done. Both products now authenticate against the same project, so one login
covers both. SAThack's existing users have an AdmissionHack workspace the moment
they open it: ah_ensure_profile creates their row on first load.

Two things left, both in the Supabase dashboard (sathack project):
  · Authentication → URL Configuration → add both origins to Redirect URLs:
      https://admissionhack-seven.vercel.app/auth/reset
      https://sathack-smoky.vercel.app
  · Authentication → Email → turn OFF "Confirm email" (or configure SMTP), or no
    new account on either product can finish signing up.

To undo: restore .env.local from .env.local.pre-ecosystem, re-run the Vercel env
commands with the old values, and redeploy.
──────────────────────────────────────────────────────────────────────────────
DONE
