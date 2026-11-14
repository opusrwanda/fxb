#!/usr/bin/env bash
#
# Put the working tree on the production server, build it, and switch to it.
#
#   scripts/deploy.sh          copy, build, swap, restart
#   scripts/deploy.sh --dry    list what would be copied and stop
#
# The server's copy is plain files, not a checkout, so this is the only thing
# that moves code there. Pushing to GitHub does not deploy.
#
# The build is written to `.next-build` (see `distDir` in next.config.ts) and
# swapped in once it has finished, so the running site never serves from a
# directory that is being rewritten. A failed build leaves the live site alone.
# The previous build is kept as `.next-old` until the next deploy.
set -euo pipefail

HOST="root@41.186.186.180"
PORT=222
APP="/home/fxb/app"

cd "$(dirname "$0")/.."

# `.env*` is excluded both ways on purpose: the server's `.env` holds the
# production secrets and must not be overwritten, and a local `.env.local`
# copied up would point the build at a database that is not there.
COPY=(rsync -rc --itemize-changes -e "ssh -o BatchMode=yes -p $PORT"
  --exclude .git --exclude node_modules --exclude media --exclude .claude
  --exclude '.next*' --exclude '.env*'
  --exclude tsconfig.tsbuildinfo --exclude next-env.d.ts)

if [[ "${1:-}" == "--dry" ]]; then
  "${COPY[@]}" -n ./ "$HOST:$APP/"
  exit 0
fi

"${COPY[@]}" ./ "$HOST:$APP/"

ssh -o BatchMode=yes -p "$PORT" "$HOST" bash -s <<'REMOTE'
set -euo pipefail
cd /home/fxb/app

# Copied as root; the app runs as fxb.
chown -R fxb:fxb src public scripts docs ./*.ts ./*.mjs ./*.json

if ! sudo -iu fxb bash -lc "cd ~/app && NEXT_DIST_DIR=.next-build npm run build" > /tmp/fxb-build.log 2>&1; then
  echo "BUILD FAILED — the live site was not touched." >&2
  tail -40 /tmp/fxb-build.log >&2
  exit 1
fi

rm -rf .next-old
mv .next .next-old
mv .next-build .next
sudo -iu fxb pm2 restart fxb > /dev/null

until curl -s -o /dev/null -m 5 http://127.0.0.1:3015/; do sleep 1; done
echo "Deployed and answering."
REMOTE
