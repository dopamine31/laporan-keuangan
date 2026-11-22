#!/usr/bin/env bash
# Pakai: bash scripts/push.sh "pesan commit"
set -e
cd "$(dirname "$0")/.."

if [ -z "$GITHUB_TOKEN" ]; then
  echo "GITHUB_TOKEN tidak ada. Push dibatalkan."
  exit 1
fi

# git-lfs hilang setiap Codespace restart, pasang lagi kalau perlu
command -v git-lfs >/dev/null 2>&1 || sudo apk add --no-cache git-lfs

git add -A
git commit -m "${1:-update}" || echo "(tidak ada perubahan baru untuk di-commit)"

# token dikirim lewat header, tidak muncul di alamat, jadi tidak ada peringatan
AUTH=$(printf 'x-access-token:%s' "$GITHUB_TOKEN" | base64 | tr -d '\n')
git -c http.extraheader="Authorization: Basic $AUTH" push origin main
