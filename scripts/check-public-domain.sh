#!/usr/bin/env bash
set -euo pipefail

legacy='mycelix\\.net|togelupnaik-mycelix\\.shop'

matches="$(git grep -nE "$legacy" -- '*.html' '*.md' '*.sh' '*.js' '*.css' '*.yml' '*.yaml' ':!docs/archive/**' || true)"

if [[ -n "$matches" ]]; then
  echo "ERROR: retired/untrusted domain found in active Mycelix site content:"
  echo "$matches"
  exit 1
fi

echo "Public domain guard: clean."
