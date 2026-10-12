#!/usr/bin/env bash
# Push AdmissionHack to GitHub — handles the one-time login for you.
set -euo pipefail

REPO="https://github.com/hamzaK228/AdmissionHack.git"
cd "$(dirname "$0")"

echo "> AdmissionHack → GitHub"
echo

# 1. GitHub CLI present?
if ! command -v gh >/dev/null 2>&1; then
  echo "! gh CLI not found. Install it from https://cli.github.com/"
  exit 1
fi

# 2. Authenticated?
if ! gh auth status --hostname github.com >/dev/null 2>&1; then
  echo "→ GitHub login required (one time)."
  echo "  A browser window will open and show a one-time code — confirm it."
  echo
  gh auth login --hostname github.com --git-protocol https --web
  echo
fi

# 3. Wire git to use gh's credentials
gh auth setup-git --hostname github.com

# 4. Push
echo "→ pushing main to ${REPO}"
git remote set-url origin "$REPO"
git push -u origin main

echo
echo "✓ done — https://github.com/hamzaK228/AdmissionHack"
